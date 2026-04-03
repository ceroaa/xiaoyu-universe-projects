from fastapi import APIRouter

router = APIRouter(tags=['system'])


@router.get('/')
def root():
    return {'message': 'AI World API is running'}


@router.get('/health')
def health():
    return {'status': 'ok'}
