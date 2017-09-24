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

In other languages, the compiler might reorder the fields to pack them more efficiently. so, say you had this struct:

```
struct Foo {
  int16 a;
  int32 b;
  int16 c;
};
```

A C compiler would lay that out in the order `a b c`, and it would be 96 bits, because `b` would need to go on a 4 byte boundary, and the whole struct gets rounded up to the next multiple of 4 bytes

A smarter compiler could lay it out in the order `b a c`, and it would be 64 bits wide, with no gaps between fields

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

And a function could looks something like this:

```
void foo<V>(V x) where V:Vec3 { ... }
```

But it'd be tedious to write it out every time, so you'd want this to mean the same:

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

This would make a Vec2 layout from a Vec3 layout. The idea here is basically to allow more controlled [type punning](https://en.wikipedia.org/wiki/Type_punning#Floating-point_example).

To use this, you might have a casting syntax:

```
void xz_move(Vec3* pos, Vec2 offset) {
  Vec2* xz_pos = (XZ*)pos;
  *xz_pos += offset;
}
```

And without eliding the layouts, that would be:

```
void xz_move<V3,V2>(V3* pos, V2 offset) where V3:Vec3, V2:Vec2 {
  XZ(V3)* xz_pos = (XZ*)pos;
  *xz_pos += offset;
}
```

That's all for now. If this inspired any thoughts, hit the tweet button below!
