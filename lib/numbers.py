from random import randint

def random_int(digits=10):

    start = 10**(digits-1)
    end = (10**digits)-1

    return randint(start, end)
