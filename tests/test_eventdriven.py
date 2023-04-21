import os
import pytest
import requests
import time
from confluent_kafka import Producer, Consumer, KafkaError, KafkaException


def test_kafka(kafka):
    producer = Producer({"bootstrap.servers": kafka})
    producer.produce("test", b"hello world")
    producer.flush()
    consumer = Consumer(
        {
            "bootstrap.servers": kafka,
            "group.id": "test",
            "auto.offset.reset": "earliest",
        }
    )

    try:
        consumer.subscribe(["test"])
        running = True

        while running:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    # End of partition event
                    sys.stderr.write(
                        "%% %s [%d] reached end at offset %d\n"
                        % (msg.topic(), msg.partition(), msg.offset())
                    )
                elif msg.error():
                    raise KafkaException(msg.error())
            else:
                print(msg.value().decode("utf-8"))
                running = False
    finally:
        # Close down consumer to commit final offsets.
        consumer.close()


@pytest.fixture(scope="session")
def kafka(docker_ip, docker_services):
    port = docker_services.port_for("kafka", 9092)
    servers = "{}:{}".format(docker_ip, port)
    # wait until service is responsive
    docker_services.wait_until_responsive(
        timeout=30.0,
        pause=0.1,
        check=lambda: is_up(docker_ip, port),
    )
    # return base url
    return servers


def is_up(ip, port):
    return os.system("nc -z {} {}".format(ip, port)) == 0
