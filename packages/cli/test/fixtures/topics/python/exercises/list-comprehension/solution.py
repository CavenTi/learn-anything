# List Comprehensions — Solution

def squares(numbers):
    return [n ** 2 for n in numbers]


def even_only(numbers):
    return [n for n in numbers if n % 2 == 0]


def flatten(matrix):
    return [item for row in matrix for item in row]


def word_lengths(words):
    return {word: len(word) for word in words}
