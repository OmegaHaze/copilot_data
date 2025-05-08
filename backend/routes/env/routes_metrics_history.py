from fastapi import APIRouter, Query
from backend.services.env.metrics_history import get_metric_history

router = APIRouter(prefix="/api/history", tags=["Metrics"])

@router.get("/{metric_type}")
async def get_metrics_history(metric_type: str, minutes: int = Query(10)):
    """Get historical metrics data for the specified metric type and time window"""
    import time
    
    # Get the raw history
    history_data = get_metric_history(metric_type)
    
    # Filter by time window
    cutoff_time = time.time() - (minutes * 60)
    filtered_data = [entry for entry in history_data if entry["timestamp"] >= cutoff_time]
        
    return filtered_data
