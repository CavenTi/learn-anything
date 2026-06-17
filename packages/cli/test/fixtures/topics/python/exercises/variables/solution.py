# Variables and Assignment — Solution

def swap(a, b):
    return b, a


def safe_divide(numerator, denominator):
    if denominator == 0:
        return None
    return numerator / denominator


def type_label(value):
    return type(value).__name__


def increment_if_number(value, delta=1):
    if isinstance(value, (int, float)):
        return value + delta
    return value
