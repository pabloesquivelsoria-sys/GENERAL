# Patrones de Arquitectura para Seguimiento en BBS

**Decisiones de Diseño y Patrones Implementables**

---

## 1. Patrones de Arquitectura

### 1.1 Patrón Event Sourcing

El seguimiento en BBS se beneficia del patrón Event Sourcing, donde cada cambio es un evento inmutable.

```
FLUJO EVENT SOURCING

┌─ Event: StateChanged
│  ├─ entity_id: "ticket_123"
│  ├─ old_state: "CREADO"
│  ├─ new_state: "ASIGNADO"
│  ├─ timestamp: 2026-10-06T14:30:00Z
│  └─ version: 1
│
└─> Event Store
    ├─ Persistencia: Inmutable
    ├─ Replay: Reconstruir estado
    └─ Audit: Completo
```

**Ventajas:**
- Auditoría completa y trazable
- Capacidad de reconstruir cualquier estado histórico
- Escalabilidad mediante replay asíncrono
- Cumplimiento normativo automático

**Implementación:**

```python
class EventStore:
    """Almacén de eventos inmutable"""
    
    def append_event(self, event: Event) -> EventID:
        """Añade evento (solo append)"""
        event.id = generate_uuid()
        event.timestamp = datetime.now(timezone.utc)
        event.version = self.get_next_version(event.aggregate_id)
        
        # Guardar evento
        self.db.insert('events', event.to_dict())
        
        # Publicar evento
        self.event_bus.publish(event)
        
        return event.id
    
    def get_events(
        self,
        aggregate_id: str,
        from_version: int = 0
    ) -> List[Event]:
        """Obtiene eventos para un agregado"""
        return self.db.query(
            'events',
            {
                'aggregate_id': aggregate_id,
                'version': {'$gte': from_version}
            },
            order_by='version ASC'
        )
    
    def replay_events(
        self,
        aggregate_id: str,
        to_version: int = None
    ) -> dict:
        """Reconstruye estado desde eventos"""
        events = self.get_events(aggregate_id)
        
        if to_version:
            events = [e for e in events if e.version <= to_version]
        
        state = {'id': aggregate_id, 'version': 0}
        
        for event in events:
            state = self.apply_event(state, event)
        
        return state
    
    def apply_event(self, state: dict, event: Event) -> dict:
        """Aplica evento al estado"""
        if event.type == 'StateChanged':
            state['status'] = event.data['new_state']
            state['updated_at'] = event.timestamp
        elif event.type == 'Assigned':
            state['assigned_to'] = event.data['user_id']
        # ... más tipos de eventos
        
        state['version'] = event.version
        return state
```

### 1.2 Patrón CQRS (Command Query Responsibility Segregation)

Separar escritura (comandos) de lectura (queries) para optimizar cada una.

```
ARQUITECTURA CQRS

           CLIENTE
              │
        ┌─────┴─────┐
        │           │
        v           v
    COMANDO      QUERY
        │           │
        v           v
   ┌─────────┐   ┌────────────┐
   │Write DB │   │ Read Model │
   │(Events) │   │(Optimized) │
   └─────────┘   └────────────┘
        │              ▲
        │              │
        └──(Sync)──────┘
```

**Beneficios:**
- Optimización independiente de lectura y escritura
- Escalabilidad horizontal
- Modelos de datos especializados
- Mejor rendimiento

**Implementación:**

```python
class CommandHandler:
    """Maneja comandos de cambio de estado"""
    
    async def handle_state_change_command(
        self,
        command: StateChangeCommand
    ) -> CommandResult:
        """Procesa comando de cambio de estado"""
        
        # Validar comando
        if not self.validate_command(command):
            raise CommandValidationError()
        
        # Cargar agregado actual
        current_state = self.event_store.replay_events(
            command.entity_id
        )
        
        # Verificar transición válida
        if not is_valid_transition(
            current_state['status'],
            command.new_status
        ):
            raise InvalidTransition()
        
        # Crear evento
        event = StateChangedEvent(
            entity_id=command.entity_id,
            old_state=current_state['status'],
            new_state=command.new_status,
            changed_by=command.user_id,
            reason=command.reason
        )
        
        # Guardar evento
        event_id = self.event_store.append_event(event)
        
        return CommandResult(success=True, event_id=event_id)

class QueryHandler:
    """Maneja queries de lectura optimizadas"""
    
    async def handle_entity_status_query(
        self,
        query: GetEntityStatusQuery
    ) -> EntityStatusDto:
        """Obtiene estado de entidad desde read model"""
        
        # Leer desde modelo optimizado
        entity = self.read_db.get_entity(query.entity_id)
        
        if not entity:
            raise EntityNotFound()
        
        return EntityStatusDto(
            id=entity['id'],
            status=entity['status'],
            assigned_to=entity['assigned_to'],
            created_at=entity['created_at'],
            updated_at=entity['updated_at']
        )
    
    async def handle_entity_history_query(
        self,
        query: GetEntityHistoryQuery
    ) -> List[HistoryEntryDto]:
        """Obtiene historial desde read model optimizado"""
        
        entries = self.read_db.get_history(
            query.entity_id,
            limit=query.limit,
            offset=query.offset
        )
        
        return [
            HistoryEntryDto.from_db(entry)
            for entry in entries
        ]
```

### 1.3 Patrón Saga para Operaciones Distribuidas

Coordinar operaciones complejas entre múltiples servicios.

```
PATRÓN SAGA

┌─ Cambio de Estado
│  ├─ Step 1: Validar transición (StateService)
│  ├─ Step 2: Verificar permisos (PermissionService)
│  ├─ Step 3: Grabar cambio (AuditService)
│  ├─ Step 4: Notificar usuarios (NotificationService)
│  └─ Step 5: Actualizar métricas (MetricsService)
│
└─ Si fallo en Step N:
   └─ Rollback Steps N-1 a 1 (compensating actions)
```

**Implementación:**

```python
class StateChangeSaga:
    """Saga para cambio de estado"""
    
    async def execute(self, command: StateChangeCommand):
        """Ejecuta saga de cambio de estado"""
        
        steps = []
        
        try:
            # Step 1: Validar
            await self.validate_step(command)
            steps.append('validate')
            
            # Step 2: Verificar permisos
            await self.verify_permissions_step(command)
            steps.append('verify_permissions')
            
            # Step 3: Cambiar estado
            await self.change_state_step(command)
            steps.append('change_state')
            
            # Step 4: Notificar
            await self.notify_step(command)
            steps.append('notify')
            
            # Step 5: Actualizar métricas
            await self.update_metrics_step(command)
            steps.append('update_metrics')
            
            return {'success': True, 'steps': steps}
        
        except Exception as e:
            # Rollback en orden inverso
            for step in reversed(steps):
                try:
                    await self.compensate(step, command)
                except Exception as comp_error:
                    logger.error(f"Compensation failed for {step}: {comp_error}")
            
            raise SagaExecutionError(f"Saga failed at step: {len(steps)}", steps)
    
    async def compensate(self, step: str, command: StateChangeCommand):
        """Compensa acción fallida"""
        compensation_handlers = {
            'validate': self.compensate_validate,
            'verify_permissions': self.compensate_verify_permissions,
            'change_state': self.compensate_change_state,
            'notify': self.compensate_notify,
            'update_metrics': self.compensate_metrics
        }
        
        handler = compensation_handlers.get(step)
        if handler:
            await handler(command)
```

---

## 2. Decisiones de Diseño Clave

### 2.1 Almacenamiento: Base de Datos Seleccionada

| Requisito | PostgreSQL | MongoDB | Cassandra |
|-----------|-----------|---------|-----------|
| **Integridad ACID** | Excelente | Buena | Eventual |
| **Escalabilidad Horizontal** | Moderada | Excelente | Excelente |
| **Auditoría Inmutable** | Excelente | Buena | Excelente |
| **Queries Complejas** | Excelente | Moderada | Limitada |
| **Costo** | Bajo | Medio | Alto |

**Recomendación: PostgreSQL** para la mayoría de casos, con Cassandra para análitica de alto volumen.

```sql
-- Particionamiento por fecha en PostgreSQL
CREATE TABLE tracking_records_2026_10
PARTITION OF tracking_records
FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE tracking_records_2026_11
PARTITION OF tracking_records
FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
```

### 2.2 Caché: Estrategia Multi-Nivel

```
ESTRATEGIA DE CACHÉ

Nivel 1: L1 Cache (Memoria de Aplicación)
├─ Entidades activas
├─ TTL: 5 minutos
├─ Tamaño: 10K-100K items
└─ Velocidad: Microsegundos

Nivel 2: L2 Cache (Redis)
├─ Entidades frecuentes
├─ TTL: 1 hora
├─ Tamaño: Millones de items
└─ Velocidad: Milisegundos

Nivel 3: Database (PostgreSQL)
├─ Fuente de verdad
├─ Persistencia completa
├─ TTL: ∞
└─ Velocidad: 10-100ms

INVALIDACIÓN:
Entity Update → Invalidate L1 → Invalidate L2 → Update DB
```

**Implementación:**

```python
class MultiLevelCache:
    """Caché con múltiples niveles"""
    
    def __init__(self):
        self.l1_cache = {}  # In-memory
        self.l2_cache = Redis()  # Redis
        self.db = PostgreSQL()  # Base de datos
    
    async def get(self, key: str) -> Any:
        """Obtiene con cascada de caché"""
        
        # Nivel 1: Memoria
        if key in self.l1_cache:
            return self.l1_cache[key]['value']
        
        # Nivel 2: Redis
        cached = await self.l2_cache.get(key)
        if cached:
            value = json.loads(cached)
            self.l1_cache[key] = {
                'value': value,
                'expires_at': datetime.now() + timedelta(minutes=5)
            }
            return value
        
        # Nivel 3: Base de datos
        value = self.db.get(key)
        if value:
            # Poblar caché
            await self.l2_cache.setex(
                key,
                3600,  # 1 hora
                json.dumps(value)
            )
            self.l1_cache[key] = {
                'value': value,
                'expires_at': datetime.now() + timedelta(minutes=5)
            }
            return value
        
        return None
    
    async def invalidate(self, key: str):
        """Invalida en todos los niveles"""
        # L1
        self.l1_cache.pop(key, None)
        
        # L2
        await self.l2_cache.delete(key)
        
        # DB: No se invalida, es fuente de verdad
```

### 2.3 Consistencia Eventual vs Strong Consistency

```
DECISIÓN DE CONSISTENCIA

Para datos críticos (cambios de estado):
→ Strong Consistency

Para datos derivados (estadísticas, métricas):
→ Eventual Consistency

IMPLEMENTACIÓN:

Write Path:
├─ Comando → Database (synchronous)
├─ Event → Event Store (synchronous)
└─ Propagate → Other Services (async)

Read Path:
├─ Estado actual → Database (immediate)
└─ Estadísticas → Cache (may be stale)
```

---

## 3. Patrones de Seguridad

### 3.1 Defense in Depth

```
CAPAS DE SEGURIDAD

Capa 7: Aplicación
├─ Validación de entrada
├─ Control de acceso
└─ Rate limiting

Capa 6: API
├─ Autenticación (JWT)
├─ Autorización
└─ Audit logging

Capa 5: Red
├─ TLS/SSL
├─ Firewall
└─ DDoS protection

Capa 4: Base de Datos
├─ Cifrado en reposo
├─ Acceso restringido
└─ Replicación segura

Capa 3: Infraestructura
├─ Encriptación disco
├─ Acceso físico
└─ Backups seguros
```

### 3.2 Implementación de Seguridad

```python
class SecurityLayer:
    """Capa de seguridad"""
    
    def __init__(self):
        self.auth = JWTAuth()
        self.crypto = CryptoManager()
        self.rate_limiter = RateLimiter()
    
    async def secure_endpoint(
        self,
        request: Request,
        handler: Callable
    ):
        """Aplica seguridad a endpoint"""
        
        # 1. Autenticación
        token = self.extract_token(request)
        if not token:
            raise AuthenticationError()
        
        user = self.auth.verify_token(token)
        if not user:
            raise AuthenticationError()
        
        # 2. Rate limiting
        if self.rate_limiter.is_limited(user.id):
            raise RateLimitExceeded()
        
        # 3. Autorización
        required_permission = self.get_required_permission(handler)
        if not self.check_permission(user, required_permission):
            raise AuthorizationError()
        
        # 4. Auditoría
        self.audit_log.log_access(user, request)
        
        # 5. Ejecutar handler
        return await handler(request, user)
```

---

## 4. Patrones de Observabilidad

### 4.1 Logging Estructurado

```python
import structlog

logger = structlog.get_logger()

def log_state_change(
    entity_id: str,
    old_state: str,
    new_state: str,
    user_id: str
):
    """Logging estructurado"""
    logger.info(
        "entity_state_changed",
        entity_id=entity_id,
        old_state=old_state,
        new_state=new_state,
        user_id=user_id,
        timestamp=datetime.now(timezone.utc),
        service="tracking",
        level="INFO"
    )
```

### 4.2 Métricas con Prometheus

```python
from prometheus_client import Counter, Histogram, Gauge

# Métricas
state_changes_total = Counter(
    'state_changes_total',
    'Total state changes',
    ['entity_type', 'old_state', 'new_state']
)

state_change_duration = Histogram(
    'state_change_duration_seconds',
    'Time to change state'
)

active_entities = Gauge(
    'active_entities',
    'Number of active entities',
    ['status']
)

def track_state_change(entity_type, old_state, new_state):
    state_changes_total.labels(
        entity_type=entity_type,
        old_state=old_state,
        new_state=new_state
    ).inc()
```

### 4.3 Trazabilidad Distribuida

```python
from jaeger_client import Config
from opentelemetry import trace

def init_tracing():
    """Inicializa trazabilidad distribuida"""
    config = Config(
        config={
            'sampler': {
                'type': 'const',
                'param': 1,
            },
            'logging': True,
        },
        service_name='bbs-tracking'
    )
    return config.initialize_tracer()

tracer = init_tracing()

@tracer.trace('state_change_operation')
async def change_state(entity_id, new_state):
    """Operación trazada"""
    with tracer.span('validate_transition') as span:
        span.set_tag('entity_id', entity_id)
        # ...
    
    with tracer.span('update_database') as span:
        span.set_tag('new_state', new_state)
        # ...
```

---

## 5. Patrones de Resiliencia

### 5.1 Circuit Breaker

```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=60)
async def call_notification_service(user_id, message):
    """Llamada con circuit breaker"""
    return await notification_service.send(user_id, message)

# Uso:
try:
    await call_notification_service(user_id, "State changed")
except CircuitBreakerListener:
    logger.warning("Notification service unavailable, using fallback")
    # Guardar en cola para reintentar más tarde
```

### 5.2 Retry con Backoff Exponencial

```python
import tenacity

@tenacity.retry(
    wait=tenacity.wait_exponential(multiplier=1, min=2, max=10),
    stop=tenacity.stop_after_attempt(3),
    reraise=True
)
async def save_tracking_record(record):
    """Guardar con reintentos"""
    return await db.save(record)
```

### 5.3 Bulkhead Pattern

```python
from concurrent.futures import ThreadPoolExecutor

class BulkheadService:
    """Aislamiento de recursos"""
    
    def __init__(self):
        self.notification_pool = ThreadPoolExecutor(
            max_workers=10,
            thread_name_prefix='notification_'
        )
        self.audit_pool = ThreadPoolExecutor(
            max_workers=5,
            thread_name_prefix='audit_'
        )
    
    def send_notification_async(self, data):
        """Enviar notificación en pool aislado"""
        return self.notification_pool.submit(
            self.notification_service.send,
            data
        )
    
    def log_audit_async(self, data):
        """Auditar en pool aislado"""
        return self.audit_pool.submit(
            self.audit_service.log,
            data
        )
```

---

## 6. Checklist de Implementación de Arquitectura

### Fase 1: Fundamentos
```
☐ Diseñar modelo de eventos
☐ Implementar Event Store
☐ Configurar base de datos principal
☐ Setup de Redis
```

### Fase 2: Servicios Core
```
☐ Comando: StateChangeCommand Handler
☐ Query: EntityStatusQuery Handler
☐ Evento: StateChangedEvent publicación
☐ Validación: Transiciones de estado
```

### Fase 3: Seguridad e Integridad
```
☐ Cifrado en reposo (TDE)
☐ Cifrado en tránsito (TLS)
☐ Control de acceso (RBAC)
☐ Auditoría inmutable
☐ Rate limiting
```

### Fase 4: Observabilidad
```
☐ Logging estructurado (ELK)
☐ Métricas (Prometheus)
☐ Trazabilidad (Jaeger)
☐ Alertas (AlertManager)
```

### Fase 5: Resiliencia
```
☐ Circuit breakers
☐ Reintentos con backoff
☐ Bulkhead isolation
☐ Graceful degradation
```

---

## Conclusión

Esta arquitectura proporciona:

1. **Auditoría Completa**: Event Sourcing garantiza trazabilidad total
2. **Escalabilidad**: CQRS permite optimizar lectura y escritura
3. **Resiliencia**: Patrones probados de tolerancia a fallos
4. **Seguridad**: Defense in depth con múltiples capas
5. **Observabilidad**: Logging, métricas y trazas integradas

La implementación debe ser progresiva, comenzando por fundamentos y añadiendo complejidad según necesario.
