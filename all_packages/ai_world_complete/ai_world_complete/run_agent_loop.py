from __future__ import annotations

import logging
import signal
import sys
import time

from app.db.session import SessionLocal
from app.services.agent_runtime import get_active_ai_controller_ids, process_controller_tick

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s %(message)s')
logger = logging.getLogger('agent_loop')
RUNNING = True


def stop(*_args):
    global RUNNING
    RUNNING = False


def run_once() -> None:
    with SessionLocal() as db:
        controller_ids = get_active_ai_controller_ids(db)
    for controller_id in controller_ids:
        with SessionLocal() as db:
            result = process_controller_tick(db, controller_id)
            if result.get('executed'):
                logger.info('%s(%s): %s -> %s', result['actor_name'], result['agent_code'], result['action_type'], result['visible_result'])


def main() -> None:
    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    logger.info('agent loop started')
    while RUNNING:
        run_once()
        time.sleep(1)
    logger.info('agent loop stopped')
    sys.exit(0)


if __name__ == '__main__':
    main()
