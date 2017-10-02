Title: PRNG Reference
Date: 2017-09-30 21:00
Modified: 2017-10-01 21:00
Tags: gamedev, math
Category: reference
Slug: prng-reference
Summary: reference guide for pseudorandom number generators
Status: published

There's a ton of information out there on pseudorandom number generators and using random numbers in your programs, but it can be hard to navigate. This is intended primarily as a reference, and secondarily as a learning resource. It contains sample implementations, design patterns, and brief explanations.

I intend to update this over time. Suggestions/comments welcome (tweet at me)!

*Last Updated: 2017-10-01*

## Contents:

- <a href="#Notation">Notation</a>
- <a href="#CryptographicPRNGs">Cryptographic PRNGs</a>
- <a href="#PRNGState">PRNG State</a>
- <a href="#Primitives">Primitives</a>
- <a href="#Implementations">Implementations</a>
- <a href="#Floats">Floats</a>
- <a href="#Range">Range</a>
- <a href="#Shuffle">Shuffle</a>
- <a href="#WeightedSelect">Weighted Select</a>
- <a href="#BagRandom">Bag Random</a>

--------
# <a name="Notation">Notation</a>


This guide uses c/c++ style pseudocode, and sometimes actual c code.

## Placeholder types:

- State : struct that holds a PRNG's current state
- Key   : part of State that is set on initialization and doesn't get updated
- uint  : an unsigned integer. either 32 bits, or an unspecified number
- float : a floating point number. either 32 bits, or unspecified number

--------


# <a name="CryptographicPRNGs">Cryptographic PRNGs</a>

Try to make your own if you want, but don't use it for anything until it's selected in [eSTREAM]() or something.
the basic idea behind most of them is that you want to scramble up your generator's state in an invertible (but confusing and diffusing) way, and then output it with a many-to-one function. 

Here's a couple good ones (don't trust this list as anything but a starting point. it will get stale):

- [Salsa20](https://en.wikipedia.org/wiki/Salsa20)/[ChaCha20](https://en.wikipedia.org/wiki/Salsa20#ChaCha_variant)
- [AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) in [CTR mode](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_.28CTR.29)

--------

# <a name="PRNGState">PRNG State</a>


There are 3 main types of PRNG based on their function signature: global state, passed state, and hashes.

<br>

## Global State

Global state generators keep their state in a global variable. You initialize it somewhere in your program before using it, and then call a function that updates the global state and returns a value.

~~~~
State state;
void init(Key key) {
  state = ...; //initialize state
}
uint rand() {
  uint value = extract_value(&state);
  update(&state);
  return value;
}
~~~~

### pros:

- simple to use
- fastest in single-threaded case

### cons:

- have to remember to initialize (some languages can do it for you)
- can't parallelize
- difficult to reproduce results in complex programs

<br>

## Passed state

Passed state generators have their state passed in as a pointer/reference parameter (or in an object oriented language, the state is an object with a rand() member function).

~~~~
State init(Key key) { ... }
uint rand(State* state) {
  uint value = extract_value(state);
  update(state);
  return value;
}
~~~~

### pros:

- almost as fast as global state
- parallelizable by initializing one per thread
- easier to reproduce results by giving different parts of program different states
- can be easily turned into a global generator

### cons:

- have to pass the state around
- can misuse by initializing two copies with same key
- still has reproducibility difficulties

<br>

## Hash

Hash based generators have all of their state passed in, and they don't update that state. They rely on the user pass in a different (probably sequential) index with every call

~~~~
uint rand(Key key, uint index) {
  return hash(key, index);
}
~~~~

### pros:

- easiest to reproduce results in complex programs
- trivially parallelizable
- always has period of 2^N, where N is bits in index
- can be used to make a (slowish) global/passed state generator

### cons:

- slower (needs more operations to get good statistical qualities)
- have to come up with unique keys all over your program
- easy to accidentally re-use keys/indices

--------
# <a name="Primitives">Primitives</a>


Here's some common operations used in creating random number generators. they can be used to update a state, or hash an index.

### some key principles are:

- output bits should depend on many input bits
- output and input should be different in roughly half of the bits, on average
- operations should be invertible (if they aren't, some outputs will be impossible, others will occur multiple times)

## xor/add with key

Makes result depend on key. doesn't create much randomness, but can help break up patterns from other generators

~~~~
x ^= key;
x += key;
~~~~

## multiply by odd number

Multiplying by an odd number (mod 2^N) diffuses changes in input across many bits. it randomizes higher bits more than lower bits, and some odd numbers work better than others. it has to be odd so that it maps every number to a unique number (2, for example will map both 0x8000000 and 0x0000000 to the same number)

~~~~
x *= 0xf46053d10d8c49f5ULL;
~~~~

## xorshift

Shifting and exclusive-or with the unshifted value diffuses changes in input in a straightforward way. usually several left/right shifts are used

~~~~
x ^= x>>27;
~~~~

## xor rotate

Basically the same idea as xorshift, but uses a rotate so that you don't lose the bits at the end. same speed on most hardware if the compiler is smart enough to optimize it to a rotate instruction

~~~~
x ^= (x>>27) | (x<<(32-27));
~~~~

## byte lookup table

Have an array of bytes 0-255, and shuffle it (or hand-craft one). use that table to replace bytes in your input. this creates good randomness per byte, since you can end up with any permutation

~~~~
char* b = &x;
for(size_t i = 0; i < sizeof(uint); ++i) {
  b[i] = lookup[b[i]];
}
~~~~ 

## xor/add with other part of state

Especially if your state is larger, adding/xoring one part with another (possibly rotated) part is helpful

~~~~
x[0] += x[1];
~~~~

--------
# <a name="Implementations">Implementations</a>

Some usable implementations of each type

## Global state

~~~~


uint64_t rand_key;
uint64_t rand_state;

void init(uint64_t key) {
  rand_key = key;
  rand_State = 0;
}

uint32_t rand() {
  uint64_t val = rand_state;

  uint64_t x = val ^ rand_key;
  x *= 0xf46053d10d8c49f5ULL;
  rand_state = x;

  val ^= val>>32;
  return (uint32_t)val;
}
~~~~

## Passed state

~~~~
typedef struct {
  uint64_t state;
  uint64_t key;
} State;

State init(uint64_t key) {
  State s;
  s.state = 0;
  s.key = key;
  return s;
}

uint32_t rand(State* s) {
  uint64_t val = s->state;

  uint64_t x = val ^ s->key;
  x *= 0xf46053d10d8c49f5ULL;
  s->state = x;

  val ^= val>>32;
  return (uint32_t)val;
}
~~~~

## Hash
~~~~
uint64_t rand(uint64_t key, uint64_t index) {
  const uint64_t c = 0xf46053d10d8c49f5ULL;
  uint64_t x = index; 

  x ^= key;
  x *= c;
  x ^= x>>32;

  x ^= key;
  x *= c;     
  x ^= x>>32; 

  return x;
}
~~~~

--------

# <a name="Floats">Floats</a>

To get a floating point value in the `[0,1)` range, set the exponent to 0 (which is 127, since it's interpreted as an 8 bit number minus 127), the mantissa to random bits, reinterpret that as a float in `[1,2)`, and then subtract 1.0

This isn't the only way to do it, but it's the fastest I'm aware of

~~~~
float to_float(uint32_t x) {
  x = (x>>9) | 0x3f800000;
  return *((float*)&x) - 1.0f;
}

double to_double(uint64_t x) {
  x = (x>>12) | 0x3ff0000000000000ULL;
  return *((double*)&x) - 1.0;
}
~~~~

and for the -1 to 1 interval, set the exponent to 1 and subtract 3.0:

~~~~
float to_float_balanced(uint32_t x) {
  x = (x>>9) | 0x40000000;
  return *((float*)&x) - 3.0f;
}

double to_double_balanced(uint64_t x) {
  x = (x>>12) | 0x4000000000000000ULL;
  return *((double*)&x) - 3.0;
}
~~~~

Each of these uses 23 bits of randomness (for 32 bit floats). You can use 24 bits (25 for the -1 to 1 case), and thus get a bit more precision, by taking a 24 bit int, casting it to a float, and then dividing by 2^24. But both the int to float cast and the divide are relatively slow instructions compared to the bit twiddling and subtraction.

Note on the balanced versions: they don't generate negative zero. you can get another bit of precision by generating a float in `[0,1)` and randomly flipping the sign bit (which can give you negative zero, and is in the `(-1,1)` range):

~~~~
float to_float_balanced(uint32_t x) {
  uint32_t sign = x&0x70000000;
  x = (x>>9) | 0x3f800000;
  float f = *((float*)&x) - 1.0f;
  x = *((uint32_t*)&f;
  x |= sign;
  return *((float*)&x);
}
~~~~

Another way to do it is to generate every possible float between 0 and 1, with probability based on how densely packed the floating point values are. Conceptually, this would be generating a real number uniformly between 0 and 1, and truncating it to the nearest floating point value. Here's a slow way to do that:

~~~~
float random_float01() {
  uint exponent = 126; //exponent is -1 after offset, which is the [0.5,1) range
  for(;exponent && rand_bool(); exponent -= 1) { /* just decrement */ }
  
  uint x = exponent<<23 | rand()>>9;
  return *((float*)&x);
}
~~~~

the basic idea here is that 50% of the time, the result should be in `[0.5, 1)`, then 25% of the time it should be `[0.25, 0.5)`, etc. and you can do that by flipping coins and decrementing the exponent, then setting the mantissa to random bits. you could speed this process up by generating more bits at a time and using a `leading_zeros` instruction, rather than doing individual coin flips

Note: this will generate [denormal floats](https://en.wikipedia.org/wiki/Denormal_number). if you don't want them, truncate them to zero or something. 

--------
# <a name="Range">Range</a>

get a random number in `[0,len)`

~~~~
uint uniform(uint len) {
  uint limit = ~0 - ~0 % len;
  uint x;
  do {
    x = rand();
  } while (x >= limit);
  return x%len;
}
~~~~

Get a random number in `[start,end)`

~~~~
uint range(uint start, uint end) {
  uint len = end-start;
  return start + uniform(len);
}
~~~~

--------
# <a name="Shuffle">Shuffle</a>

Shuffle an array

~~~~
void shuffle(void** v, uint c) {
  for(uint i = 0; i < c-1; ++i) {
    uint j = i+range(i-c);
    void* temp = v[i];
    v[i] = v[j];
    v[j] = temp;
  }
}
~~~~

--------


# <a name="WeightedSelect">Weighted Select</a>

Select an index from an array of weights (non-normalized probabilities).

You can modify this to compute weights as you go through a collection, and you can filter elements by setting their weight to 0 (or using 'continue'). The size of the collection doesn't need to be known in advance, if you're using a stream of some sort instead of an array.

~~~~
int weighted_select(float* weightv, int weightc) {
  float total = 0;
  int index = -1;

  for(int i = 0; i < weightc; ++i) {
    float w = weightv[i];
    total += w;
    float r = to_float(rand()) * total;
    if(r < w) index = i;
  }

  return index;
}
~~~~

--------

# <a name="BagRandom">Bag Random</a>

Sample without replacement. This is based on the fischer yeates shuffle, but yields a result at each step rather than doing the full shuffle up front.

to use: initialize 'current' to -1. returns NULL and sets 'current' to -1 when the bag is empty.

~~~~
void* bag_random(void** itemv, int itemc, int* current) {
  int cur = *current += 1;
  if(cur == itemc) {
    *current = -1;
    return NULL;
  }
  var swp = cur+range(itemc-cur);

  void* temp = itemv[swp];
  itemv[swp] = itemv[cur];
  itemv[cur] = temp;
  return temp;
}
~~~~

and here's a looping variant of it, where instead of returning NULL, it starts the process over:

~~~~
void* bag_random_looping(void** itemv, int itemc, int* current) {
  int cur = *current += 1;
  if(cur == itemc) {
    cur = *current = 0;
  }
  var swp = cur+range(itemc-cur);

  void* temp = itemv[swp];
  itemv[swp] = itemv[cur];
  itemv[cur] = temp;
  return temp;
}
~~~~

--------
