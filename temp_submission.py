class Greeter:
    def __init__(self, name):
        self.name = name

    def greet(self):
        return f"Hello, {self.name}!"

person = Greeter("Satvik")
print(person.greet())