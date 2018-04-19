Title: state machines
Date: 2018-04-19 19:00
Tags: blag
Category: blag
Slug: state-machines
Summary: dirt simple state machines (in c)
Status: published

Here's a cool trick I stumbled upon for writing state machines. Works in C, and many other languages.

Each state is a function, and it returns the next state (also a function). the outer loop is `loop { state = state(); }`

here's an example for a state machine to parse the regular expression "(ab)*c"

```
/* (ab)*c.c */

#include "stdio.h"

//state machine types (C won't let you do a self-referential typedef, so wraping it in a struct is necessary)
typedef struct state state;
typedef state state_fn(int c);
struct state { state_fn* fn; };

//pre-declare the states
state_fn s_init, s_a, s_c, s_ok, s_fail;

//implement the states
state s_init(int c) {
	switch(c) {
		case 'a': return (state){s_a};
		case 'c': return (state){s_c};
		default: return (state){s_fail};
	}
}

state s_fail(int c) {
	return (state){s_fail};
}

state s_ok(int c) {
	return (state){s_fail};
}

state s_a(int c) {
	switch(c) {
		case 'b': return (state){s_init};
		default: return (state){s_fail};
	}
}

state s_c(int c) {
	switch(c) {
		case '\n': return (state){s_ok};
		default: return (state){s_fail};
	}
}


int main(int argc, char** argv) {
	
	//initialize
	state s = (state){s_init};

	//run
	for(int c; (c=getchar()) >= 0;) {
		s = s.fn(c);
	}

	//check if it's in accepting state (and negate, because unix 0 is true)
	return s.fn != s_ok;
}

```

compile:
```
gcc "(ab)*c.c" -o "(ab)*c"
```

run:
```
$ echo "ac" | "./(ab)*c" && echo "yes" || echo "no"
no
$ echo "abc" | "./(ab)*c" && echo "yes" || echo "no"
yes
$ echo "c" | "./(ab)*c" && echo "yes" || echo "no"
yes
$ echo "xyz" | "./(ab)*c" && echo "yes" || echo "no"
no
```
