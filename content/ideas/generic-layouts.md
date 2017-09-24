Title: Language Idea: Generic Memory Layouts
Date: 2017-09-24 12:30
Tags: blag, language
Category: blag
Slug: generic-memory-layouts
Summary: Language ideas specifying memory layout and abstracting over it
Status: draft

Sometimes I have thoughts on language features that would be fun to play around with. But writing a compiler is currently low on my priorities, so I'll dump it here instead.

In C, a struct definition defines the interface to a struct (the set of fields it has), and its memory layout. 

The order of the fields (and their size and alignment) determines how it will be laid out in memory.
But, what if we want more control of how it's laid out? What if we have a memory mapped file that some other program insists be laid out another way? or what if we wanted to treat an array of 3d vectors as 2d vectors for some operation?

# What is a layout?

The compiler needs a way to turn a field name into an offset from a pointer.

In C, the compiler uses a greedy algorithm to to this: it walks through the fields in your struct, and puts that field at the next possible spot. so, it advances by `sizeof()` after every field, and then skips ahead to the next multiple of `alignof()` before every field, and then the size of the struct is rounded up to a multiple of the largest alignment in the struct.

In other languages, the compiler might reorder the fields to pack them more efficiently. It might change `(int16,int32,int16)` into `(int32,int16,int16)`, since the former order would take 96 bytes, while the latter would take 64.

# Separating Layout from Interface

```
struct Vec3 {
  float x,y,z;
};

struct Vec3 {
  float y,x,z;
};
```

These two structs can be used the same way in your code. 
If you swap struct definitions, the rest of your code that uses it can stay the same, as long as it's not relying on a particular memory layout. 
The semantics (other than layout) don't change if you reorder the fields: you don't have to re-write any functions. 

What if we specified them separately?

```
struct Vec3 {
  float x,y,z;
};

layout Vec3_XYZ : Vec3 {
  x,y,z;
};

layout Vec3_YXZ : Vec3 {
  y,x,z;
};
```

and a function could looks something like this:

```
void foo<V>(V x) where V:Vec3 { ... }
```

but it'd be tedious to write it out every time, so you'd want this to mean the same:

```
void foo(Vec3 x) { ... }
```

# Layout functions

```
layout Vec2 XZ(Vec3 v) {
  x = v.x;
  y = v.z;
}
```

this would make a Vec2 layout from a Vec3 layout. The idea here is basically to allow more controlled type punning.
