Title: language idea: plurals
Date: 2019-01-09 12:00
Tags: blag
Category: blag
Slug: plurals
Summary: what if programming languages understood plurals?
Status:draft

*[note: this is a bad idea]*

In haskell, there's a convention for a list of things to have a plural name.

for example, haskell's `map` function uses `x` for a single element of a list, and `xs` for a list:

```haskell
map f [] = []
map f (x:xs) = f x : map f xs
```

What if a language understood plurals for the purposes of `foreach` loops?

Here's some normal python code:

```python
def items = ...
for item in items:
  DoStuff(item)
```

And here's what it could look like if it understood plurals:

```python
def items = ...
foreach item:
  DoStuff(item)
```

The idea is that `item` would get pluralized to `items`, so there's no need to specify the collection that's being looped through. The lnguage could figure it out from the singular!

Here's another example, with nested loops:

```python
def data = ...
def boxen = ...
def codices = ...

foreach datum:
  foreach box:
    foreach codex:
      DoStuff(item,box,codex)
```
