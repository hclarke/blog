Title: allocating address space
Date: 2018-06-07 20:00
Tags: blag
Category: blag
Slug: allocation
Summary: allocating more memory than your computer has is totally fine

Here's a C program that allocates 1TB of memory:

```
#include "stdlib.h"
#include "stdio.h"

int main(int argc, char** argv) {
	//allocate 1TB of memory
	int* data = (int*)malloc((1ULL<<40));

	//read an integer from user
	long long index;
	scanf("%lld", &index);

	//touch that much memory
	for(long long i = 0; i < index; ++i) {
		data[i] += 1;
	}

	//clean up
	free(data);

	//happily finish
	printf("(^_^)\n");
}
```

If you're like me, and have less than 1TB of memory and a limited understanding of what malloc does, 
you'd expect that to crash immediately.

Then you'd run it, see the program waiting for your input, and wonder if maybe the optimizer optimized the allocation away since it never gets used.
So, you'd try a small number like `10000`, and see the program happily finish.

You'd test out the theory that the allocation is optimized away. 
You could look at the assembly produced, but you're lazy, so you just give it a bigger input value and see if it takes any longer to finish. 
You type in `1000000000` (about 4GB, if ints are 4 bytes), and it takes a second or two before happily finishing. Doesn't seem optimized away.

Then you'd remember a little detail from operating systems class: memory addresses go through the memory mapper so that things can be swapped to disk when you're using too much memory. And if you never touch the allocated memory, the operating system can slack off and never actually allocate physical memory or even part of the swap file.

And then you'd be curious how big your swap file is. Again, you're lazy, so instead of looking it up, you give the program a really big number, and watch the process' memory usage climb until it crashes. While watching it, you'd realize that OSX has some neat-looking compression feature in its memory manager that allows it to swap less, and leave testing the swap size as an excercise for the reader.

-----

Lesson learned: malloc gives you a range of addresses. It does not guarantee that those addresses are backed by any actual memory.

Lesson not (yet) learned: You shouldn't rely on this behaviour in actual programs.
