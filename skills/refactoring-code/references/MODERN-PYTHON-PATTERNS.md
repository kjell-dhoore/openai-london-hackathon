# Modern Python Patterns

The Python style reference is [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html).

## Use Google Style Docstrings

```python
# Before
def fetch_records(client, query, limit=100):
    if not query:
        raise ValueError("query must be non-empty")
    return client.search(query, max=limit)

# After (same code; docstring added)
def fetch_records(client, query, limit=100):
    """Fetch records from the data store matching a query.

    Args:
        client: Authenticated data-store client.
        query: Search expression (supports wildcards).
        limit: Maximum number of records to return.

    Returns:
        Matching records.

    Raises:
        ValueError: When query is empty.
    """
    if not query:
        raise ValueError("query must be non-empty")
    return client.search(query, max=limit)
```

## Use Comprehensions

```python
# Before
result = []
for item in items:
    if item > 0:
        result.append(item * 2)

# After
result = [item * 2 for item in items if item > 0]
```

## Use F-strings

```python
# Before
message = "Hello, %s!" % name
message = "Hello, {}!".format(name)

# After
message = f"Hello, {name}!"
```

## Use Type Hints (Python 3.10+)

```python
# Before
def process(data):
    return [x * 2 for x in data]

# After
def process(data: list[int] | None) -> list[int]:
    return [x * 2 for x in data] if data else []
```

## Use Dataclasses

```python
# Before
class Point:
    def __init__(self, x: int, y: int):
        self.x = x
        self.y = y

# After
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int
```

## Use Context Managers

```python
# Before
file = open('config.json')
data = file.read()
file.close()

# After
with open('config.json') as file:
    data = file.read()
```

## Use Pathlib

```python
# Before
import os
path = os.path.join(dir, 'config', 'file.json')

# After
from pathlib import Path
path = Path(dir) / 'config' / 'file.json'
data = path.read_text()
```
