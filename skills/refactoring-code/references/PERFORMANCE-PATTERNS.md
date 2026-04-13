# Performance Patterns

## Use Sets for Membership

```python
# Before - O(n)
allowed = [1, 2, 3, 4, 5]
if user_id in allowed:  # Slow
    ...

# After - O(1)
allowed = {1, 2, 3, 4, 5}
if user_id in allowed:  # Fast
    ...
```

## Use Generators for Large Data

```python
# Before - loads all in memory
def process_numbers(limit):
    return [x * 2 for x in range(limit)]

result = process_numbers(1_000_000)  # Creates list of 1M items
print(result[0])  # Only need first item, but loaded all 1M!

# After - lazy evaluation
def process_numbers(limit):
    for x in range(limit):
        yield x * 2

result = process_numbers(1_000_000)  # Generator created, no computation yet
print(next(result))  # Only computes first item

# For file processing:
def read_file(path):
    with open(path) as f:
        for line in f:
            yield line.strip()  # File stays open during iteration
```

## Cache Repeated Lookups

```python
# Before
for item in items:
    if self.config.get('enabled'):
        process(item, self.config.get('timeout'))

# After
enabled = self.config.get('enabled')
timeout = self.config.get('timeout')
for item in items:
    if enabled:
        process(item, timeout)
```
