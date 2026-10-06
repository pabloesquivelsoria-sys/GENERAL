# Implementación Práctica de Seguimiento en BBS

**Ejemplos de Código y Patrones Implementables**

---

## 1. Implementación de Seguimiento con FastAPI

### 1.1 Modelos Pydantic

```python
# models.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class EntityStatus(str, Enum):
    """Estados posibles de una entidad"""
    CREADO = "CREADO"
    ASIGNADO = "ASIGNADO"
    EN_PROGRESO = "EN_PROGRESO"
    BLOQUEADO = "BLOQUEADO"
    REVISIÓN = "REVISIÓN"
    RESUELTO = "RESUELTO"
    CERRADO = "CERRADO"

class TrackingRecord(BaseModel):
    """Registro de seguimiento"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    entity_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    old_status: Optional[EntityStatus] = None
    new_status: EntityStatus
    changed_by: str
    reason: Optional[str] = None
    metadata: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    session_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "track_123",
                "entity_id": "entity_456",
                "timestamp": "2026-10-06T14:30:45Z",
                "old_status": "CREADO",
                "new_status": "ASIGNADO",
                "changed_by": "user_123",
                "reason": "Assigned to resolver team"
            }
        }

class EntityCreate(BaseModel):
    """Crear nueva entidad"""
    type: str
    name: str
    description: Optional[str] = None
    priority: str = "MEDIA"
    assigned_to: Optional[str] = None

class StateChangeRequest(BaseModel):
    """Solicitud de cambio de estado"""
    new_status: EntityStatus
    reason: str
    metadata: Optional[Dict[str, Any]] = {}
```

### 1.2 Servicio de Seguimiento

```python
# services/tracking_service.py
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker
from typing import List, Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

class TrackingService:
    """Servicio de seguimiento de entidades"""
    
    def __init__(self, db_connection_string: str):
        self.engine = create_engine(db_connection_string)
        self.SessionLocal = sessionmaker(bind=self.engine)
    
    def record_state_change(
        self,
        entity_id: str,
        old_status: Optional[EntityStatus],
        new_status: EntityStatus,
        changed_by: str,
        reason: str = "",
        ip_address: Optional[str] = None,
        session_id: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> TrackingRecord:
        """Registra cambio de estado"""
        
        session = self.SessionLocal()
        try:
            # Validar transición
            if not self.is_valid_transition(old_status, new_status):
                raise ValueError(
                    f"Invalid transition: {old_status} -> {new_status}"
                )
            
            # Crear registro de seguimiento
            record = TrackingRecord(
                entity_id=entity_id,
                timestamp=datetime.now(timezone.utc),
                old_status=old_status,
                new_status=new_status,
                changed_by=changed_by,
                reason=reason,
                ip_address=ip_address,
                session_id=session_id,
                metadata=metadata or {}
            )
            
            # Guardar en base de datos
            db_record = TrackingRecordDB(**record.dict())
            session.add(db_record)
            session.commit()
            
            logger.info(
                f"State change recorded: {entity_id} "
                f"{old_status} -> {new_status} by {changed_by}"
            )
            
            # Emitir evento
            self.emit_event("entity.state_changed", record)
            
            # Revisar SLA
            self.check_sla(entity_id)
            
            return record
        
        except Exception as e:
            session.rollback()
            logger.error(f"Error recording state change: {e}")
            raise
        finally:
            session.close()
    
    def get_entity_history(
        self,
        entity_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[TrackingRecord]:
        """Obtiene historial de entidad"""
        
        session = self.SessionLocal()
        try:
            records = session.query(TrackingRecordDB).filter(
                TrackingRecordDB.entity_id == entity_id
            ).order_by(
                desc(TrackingRecordDB.timestamp)
            ).limit(limit).offset(offset).all()
            
            return [TrackingRecord.from_orm(r) for r in records]
        finally:
            session.close()
    
    def is_valid_transition(
        self,
        current: Optional[EntityStatus],
        next_state: EntityStatus
    ) -> bool:
        """Valida transición de estado"""
        
        valid_transitions = {
            None: [EntityStatus.CREADO],
            EntityStatus.CREADO: [
                EntityStatus.ASIGNADO,
                EntityStatus.CANCELADO
            ],
            EntityStatus.ASIGNADO: [
                EntityStatus.EN_PROGRESO,
                EntityStatus.CANCELADO
            ],
            EntityStatus.EN_PROGRESO: [
                EntityStatus.BLOQUEADO,
                EntityStatus.REVISIÓN
            ],
            EntityStatus.BLOQUEADO: [
                EntityStatus.EN_PROGRESO
            ],
            EntityStatus.REVISIÓN: [
                EntityStatus.RESUELTO,
                EntityStatus.EN_PROGRESO
            ],
            EntityStatus.RESUELTO: [
                EntityStatus.CERRADO,
                EntityStatus.EN_PROGRESO
            ],
            EntityStatus.CERRADO: []
        }
        
        return next_state in valid_transitions.get(current, [])
    
    def emit_event(self, event_type: str, data: dict):
        """Emite evento para procesamiento asíncrono"""
        # Implementar con RabbitMQ, Kafka, etc.
        pass
    
    def check_sla(self, entity_id: str):
        """Verifica incumplimiento de SLA"""
        # Implementar lógica de SLA
        pass
```

### 1.3 Endpoints de API

```python
# routes/tracking.py
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
import logging

router = APIRouter(prefix="/api/v1/tracking", tags=["tracking"])
logger = logging.getLogger(__name__)

@router.post("/entities/{entity_id}/state-change")
async def change_entity_state(
    entity_id: str,
    request_data: StateChangeRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    tracking_service: TrackingService = Depends(get_tracking_service)
):
    """Cambia estado de entidad"""
    
    try:
        # Verificar permisos
        if not has_permission(current_user, "change_state", entity_id):
            raise HTTPException(status_code=403, detail="Forbidden")
        
        # Obtener estado actual
        entity = tracking_service.get_entity(entity_id)
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        
        # Registrar cambio
        record = tracking_service.record_state_change(
            entity_id=entity_id,
            old_status=entity['status'],
            new_status=request_data.new_status,
            changed_by=current_user['id'],
            reason=request_data.reason,
            ip_address=request.client.host,
            session_id=request.cookies.get('session_id'),
            metadata=request_data.metadata
        )
        
        # Enviar notificaciones
        notify_stakeholders(entity_id, record)
        
        return {
            "success": True,
            "record": record.dict(),
            "entity": entity
        }
    
    except Exception as e:
        logger.error(f"Error changing state: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/entities/{entity_id}/history")
async def get_entity_history(
    entity_id: str,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
    tracking_service: TrackingService = Depends(get_tracking_service)
) -> dict:
    """Obtiene historial de entidad"""
    
    try:
        # Verificar permisos de lectura
        if not has_permission(current_user, "read_entity", entity_id):
            raise HTTPException(status_code=403, detail="Forbidden")
        
        # Obtener historial
        records = tracking_service.get_entity_history(
            entity_id=entity_id,
            limit=limit,
            offset=offset
        )
        
        return {
            "entity_id": entity_id,
            "total": len(records),
            "limit": limit,
            "offset": offset,
            "records": [r.dict() for r in records]
        }
    
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/entities/{entity_id}/audit")
async def get_entity_audit(
    entity_id: str,
    current_user: dict = Depends(get_current_user),
    audit_service: AuditService = Depends(get_audit_service)
) -> dict:
    """Obtiene log de auditoría de entidad"""
    
    try:
        # Solo admins pueden ver auditoría completa
        if not is_admin(current_user):
            raise HTTPException(status_code=403, detail="Admin only")
        
        audit_logs = audit_service.get_audit_trail(entity_id)
        
        return {
            "entity_id": entity_id,
            "audit_logs": audit_logs,
            "total_actions": len(audit_logs)
        }
    
    except Exception as e:
        logger.error(f"Error fetching audit: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 2. Implementación de Notificaciones

### 2.1 Servicio de Notificaciones

```python
# services/notification_service.py
from typing import List, Optional
from enum import Enum
import json
from datetime import datetime, timezone

class NotificationChannel(str, Enum):
    """Canales de notificación"""
    EMAIL = "email"
    IN_APP = "in_app"
    SMS = "sms"
    SLACK = "slack"
    WEBHOOK = "webhook"

class NotificationSeverity(str, Enum):
    """Niveles de severidad"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class NotificationService:
    """Servicio de notificaciones"""
    
    def __init__(self, config: dict):
        self.email_service = EmailService(config.get('email'))
        self.sms_service = SMSService(config.get('sms'))
        self.slack_service = SlackService(config.get('slack'))
        self.webhook_service = WebhookService(config.get('webhook'))
        self.db = DatabaseConnection(config.get('database'))
    
    def send_notification(
        self,
        user_id: str,
        event_type: str,
        title: str,
        message: str,
        severity: NotificationSeverity = NotificationSeverity.MEDIUM,
        metadata: Optional[dict] = None
    ):
        """Envía notificación a usuario"""
        
        # Obtener preferencias de usuario
        preferences = self.get_user_preferences(user_id)
        
        # Obtener canales configurados
        channels = self._get_enabled_channels(preferences, severity)
        
        # Preparar contenido
        content = {
            "title": title,
            "message": message,
            "event_type": event_type,
            "severity": severity.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {}
        }
        
        # Verificar quiet hours
        if self._in_quiet_hours(preferences):
            channels = [c for c in channels if c in [
                NotificationChannel.IN_APP
            ]]
        
        # Enviar por cada canal
        for channel in channels:
            try:
                if channel == NotificationChannel.EMAIL:
                    self.email_service.send(
                        user_id,
                        title,
                        content
                    )
                elif channel == NotificationChannel.SMS:
                    self.sms_service.send(
                        user_id,
                        f"{title}: {message[:150]}"
                    )
                elif channel == NotificationChannel.SLACK:
                    self.slack_service.send(
                        user_id,
                        content
                    )
                elif channel == NotificationChannel.IN_APP:
                    self._save_in_app_notification(user_id, content)
                elif channel == NotificationChannel.WEBHOOK:
                    self.webhook_service.send(user_id, content)
            
            except Exception as e:
                logger.error(
                    f"Error sending {channel} notification: {e}"
                )
                # Registrar fallo
                self.log_notification_failure(
                    user_id,
                    channel,
                    str(e)
                )
    
    def _get_enabled_channels(
        self,
        preferences: dict,
        severity: NotificationSeverity
    ) -> List[NotificationChannel]:
        """Obtiene canales habilitados según preferencias"""
        
        severity_config = preferences.get(
            'severity_levels',
            {}
        ).get(severity.value, {})
        
        channels = []
        
        if severity_config.get('email', False):
            channels.append(NotificationChannel.EMAIL)
        if severity_config.get('sms', False):
            channels.append(NotificationChannel.SMS)
        if severity_config.get('slack', False):
            channels.append(NotificationChannel.SLACK)
        if severity_config.get('in_app', True):  # Default true
            channels.append(NotificationChannel.IN_APP)
        
        return channels
    
    def _in_quiet_hours(self, preferences: dict) -> bool:
        """Verifica si estamos en quiet hours"""
        
        quiet_hours = preferences.get('quiet_hours')
        if not quiet_hours:
            return False
        
        now = datetime.now().time()
        start = datetime.strptime(
            quiet_hours['start'],
            '%H:%M'
        ).time()
        end = datetime.strptime(
            quiet_hours['end'],
            '%H:%M'
        ).time()
        
        return start <= now <= end
    
    def _save_in_app_notification(self, user_id: str, content: dict):
        """Guarda notificación en app"""
        
        notification = {
            "user_id": user_id,
            "title": content['title'],
            "message": content['message'],
            "type": content['event_type'],
            "severity": content['severity'],
            "created_at": content['timestamp'],
            "read": False,
            "metadata": content.get('metadata')
        }
        
        self.db.insert('in_app_notifications', notification)
```

### 2.2 Procesamiento Asíncrono con Celery

```python
# tasks/notification_tasks.py
from celery import Celery
from typing import List
import logging

celery_app = Celery('bbs_tracking')
celery_app.config_from_object('celery_config')

logger = logging.getLogger(__name__)

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60
)
def send_notification_async(
    self,
    user_id: str,
    event_type: str,
    title: str,
    message: str,
    severity: str = "medium",
    metadata: dict = None
):
    """Tarea asíncrona de envío de notificación"""
    
    try:
        notification_service.send_notification(
            user_id=user_id,
            event_type=event_type,
            title=title,
            message=message,
            severity=severity,
            metadata=metadata
        )
        
        logger.info(
            f"Notification sent to {user_id} "
            f"for {event_type}"
        )
    
    except Exception as e:
        logger.error(f"Error sending notification: {e}")
        
        # Reintentar con backoff exponencial
        raise self.retry(exc=e)

@celery_app.task
def notify_stakeholders(entity_id: str, tracking_record: dict):
    """Notifica a interesados sobre cambio de estado"""
    
    # Obtener entidad
    entity = db.get_entity(entity_id)
    
    # Obtener lista de interesados
    stakeholders = get_stakeholders(entity)
    
    for stakeholder in stakeholders:
        # Determinar si debe recibir notificación
        if should_notify(stakeholder, tracking_record):
            send_notification_async.delay(
                user_id=stakeholder['user_id'],
                event_type='entity.state_changed',
                title=f"Entity {entity['name']} state changed",
                message=f"New state: {tracking_record['new_status']}",
                severity=get_severity(tracking_record['new_status']),
                metadata={
                    'entity_id': entity_id,
                    'old_state': tracking_record['old_status'],
                    'new_state': tracking_record['new_status'],
                    'reason': tracking_record.get('reason')
                }
            )
```

---

## 3. Implementación de Auditoría

### 3.1 Decorador de Auditoría

```python
# decorators/audit.py
from functools import wraps
from typing import Any, Callable
import json
import logging

logger = logging.getLogger(__name__)

def audit_action(
    action_type: str,
    entity_type: str = None,
    include_args: bool = True,
    include_result: bool = False
):
    """Decorador para auditar acciones"""
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            request = None
            current_user = None
            
            # Extraer contexto de función (si es endpoint FastAPI)
            for arg in args:
                if hasattr(arg, 'client'):
                    request = arg
                    break
            
            # Extraer usuario actual
            if 'current_user' in kwargs:
                current_user = kwargs['current_user']
            
            # Registrar entrada
            audit_log = {
                'action_type': action_type,
                'entity_type': entity_type,
                'function': func.__name__,
                'timestamp': datetime.now(timezone.utc),
                'user_id': current_user.get('id') if current_user else 'anonymous',
                'ip_address': request.client.host if request else None,
                'args': str(args) if include_args else None,
                'status': 'STARTED'
            }
            
            try:
                # Ejecutar función
                result = await func(*args, **kwargs)
                
                # Registrar éxito
                audit_log['status'] = 'SUCCESS'
                if include_result:
                    audit_log['result'] = str(result)[:500]
                
                return result
            
            except Exception as e:
                # Registrar error
                audit_log['status'] = 'ERROR'
                audit_log['error'] = str(e)
                logger.error(f"Audit error for {func.__name__}: {e}")
                raise
            
            finally:
                # Guardar en auditoría
                audit_service.log_action(audit_log)
        
        return async_wrapper
    
    return decorator

# Uso:
@router.post("/entities/{entity_id}/state-change")
@audit_action(
    action_type="STATE_CHANGE",
    entity_type="incident",
    include_args=True
)
async def change_state(
    entity_id: str,
    request_data: StateChangeRequest,
    current_user: dict = Depends(get_current_user)
):
    pass
```

---

## 4. Base de Datos - Esquema SQL

```sql
-- tracking_records.sql
CREATE TABLE tracking_records (
    id VARCHAR(36) PRIMARY KEY,
    entity_id VARCHAR(36) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(36) NOT NULL,
    reason TEXT,
    metadata JSON,
    ip_address VARCHAR(45),
    session_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para búsquedas rápidas
    INDEX idx_entity_timestamp (entity_id, timestamp DESC),
    INDEX idx_changed_by (changed_by, timestamp DESC),
    INDEX idx_new_status (new_status, timestamp DESC),
    INDEX idx_timestamp (timestamp DESC),
    
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    entity_id VARCHAR(36),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(36) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    changes JSON,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    session_id VARCHAR(36),
    status VARCHAR(20),
    error_message TEXT,
    
    -- Índices
    INDEX idx_timestamp (timestamp DESC),
    INDEX idx_entity_action (entity_id, action_type),
    INDEX idx_user_timestamp (user_id, timestamp DESC),
    
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications_sent (
    id VARCHAR(36) PRIMARY KEY,
    entity_id VARCHAR(36),
    user_id VARCHAR(36) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    message TEXT,
    severity VARCHAR(20),
    status VARCHAR(20),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    
    INDEX idx_user_created (user_id, sent_at DESC),
    INDEX idx_status (status),
    
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE role_assignments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    scope VARCHAR(50),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(36),
    expiry TIMESTAMP NULL,
    active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_user_active (user_id, active),
    INDEX idx_expiry (expiry),
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. Tests Unitarios

```python
# tests/test_tracking_service.py
import pytest
from datetime import datetime, timezone
from unittest.mock import Mock, patch

@pytest.fixture
def tracking_service():
    """Fixture para servicio de seguimiento"""
    return TrackingService("sqlite:///:memory:")

@pytest.fixture
def sample_entity():
    """Fixture para entidad de prueba"""
    return {
        "id": "entity_123",
        "type": "incident",
        "name": "Test Incident",
        "status": "CREADO"
    }

def test_record_state_change_success(tracking_service, sample_entity):
    """Test: Registrar cambio de estado correctamente"""
    
    record = tracking_service.record_state_change(
        entity_id=sample_entity["id"],
        old_status=EntityStatus.CREADO,
        new_status=EntityStatus.ASIGNADO,
        changed_by="user_123",
        reason="Assigned to team",
        ip_address="192.168.1.1",
        session_id="session_abc"
    )
    
    assert record.id is not None
    assert record.entity_id == "entity_123"
    assert record.old_status == EntityStatus.CREADO
    assert record.new_status == EntityStatus.ASIGNADO
    assert record.changed_by == "user_123"
    assert record.reason == "Assigned to team"

def test_invalid_state_transition(tracking_service, sample_entity):
    """Test: Rechazar transición de estado inválida"""
    
    with pytest.raises(ValueError):
        tracking_service.record_state_change(
            entity_id=sample_entity["id"],
            old_status=EntityStatus.CERRADO,
            new_status=EntityStatus.EN_PROGRESO,
            changed_by="user_123",
            reason="Invalid transition"
        )

def test_get_entity_history(tracking_service, sample_entity):
    """Test: Obtener historial de entidad"""
    
    # Registrar múltiples cambios
    states = [
        EntityStatus.CREADO,
        EntityStatus.ASIGNADO,
        EntityStatus.EN_PROGRESO
    ]
    
    for i, state in enumerate(states[:-1]):
        tracking_service.record_state_change(
            entity_id=sample_entity["id"],
            old_status=state,
            new_status=states[i + 1],
            changed_by="user_123"
        )
    
    # Obtener historial
    history = tracking_service.get_entity_history(
        sample_entity["id"]
    )
    
    assert len(history) >= 2
    assert history[0].new_status == EntityStatus.EN_PROGRESO

@pytest.mark.asyncio
async def test_notification_sent_on_state_change(tracking_service):
    """Test: Notificación enviada al cambiar estado"""
    
    with patch('notification_service.send_notification') as mock_notify:
        tracking_service.record_state_change(
            entity_id="entity_123",
            old_status=EntityStatus.CREADO,
            new_status=EntityStatus.ASIGNADO,
            changed_by="user_123"
        )
        
        # Verificar que notificación fue enviada
        mock_notify.assert_called()
```

---

## 6. Configuración de Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/bbs_tracking
      REDIS_URL: redis://cache:6379
      RABBITMQ_URL: amqp://guest:guest@queue:5672/
    depends_on:
      - db
      - cache
      - queue
    volumes:
      - ./logs:/app/logs

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: bbs_tracking
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  cache:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

  queue:
    image: rabbitmq:3.12
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest

volumes:
  pgdata:
  redisdata:
```

---

Este documento proporciona implementaciones prácticas que pueden ser usadas directamente en un proyecto de BBS con seguimiento.
