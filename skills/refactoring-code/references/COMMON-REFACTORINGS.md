# Common Refactorings

## Extract Function

```python
# Before - long function mixing concerns
def generate_report(data):
    total = sum(item['amount'] for item in data)
    avg = total / len(data)
    return f"Report\nTotal: ${total:.2f}\nAvg: ${avg:.2f}"

# After - extracted logic
def generate_report(data):
    stats = calculate_statistics(data)
    return format_report(stats)

def calculate_statistics(data):
    total = sum(item['amount'] for item in data)
    return {'total': total, 'average': total / len(data)}

def format_report(stats):
    return f"Report\nTotal: ${stats['total']:.2f}\nAvg: ${stats['average']:.2f}"
```

## Replace Long Parameter List

```python
# Before
def create_user(name: str, email: str, age: int, address: str, phone: str):
    pass

# After - use dataclass
from dataclasses import dataclass

@dataclass
class UserData:
    name: str
    email: str
    age: int
    address: str
    phone: str

def create_user(data: UserData):
    pass
```

## Replace Type Code with Polymorphism

```python
# Before
def make_sound(animal_type: str) -> str:
    if animal_type == "dog":
        return "Woof"
    elif animal_type == "cat":
        return "Meow"

# After
from abc import ABC, abstractmethod

class Animal(ABC):
    @abstractmethod
    def make_sound(self) -> str:
        pass

class Dog(Animal):
    def make_sound(self) -> str:
        return "Woof"
```
