import pytest

@pytest.fixture(scope='session')
def docker_compose_command():
    return 'docker compose'