import asyncio
from concurrent.futures import ThreadPoolExecutor

async def __task__(loop, count):
    print(f'{loop} in __task__')
    print(f'{count}')

def run():
    loop = asyncio.get_event_loop()
    print(f'{loop} before')

    loop.set_default_executor(ThreadPoolExecutor(max_workers=10))

    # fori loop to run_in_executor
    for i in range(10):
        loop.run_in_executor(None, __task__(loop, i))
        # loop.run_until_complete(__task__(loop, i))
    print(f'{loop} after')


    loop.close()
    print(f'{loop}')