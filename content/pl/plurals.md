Title: language idea: plurals
Date: 2019-01-09 12:00
Tags: blag
Category: blag
Slug: plurals
Summary: what if programming languages understood plurals?
Status: published

*[note: this is a bad idea]*

What if a programming language understood plurals for the purposes of `foreach` loops?

Here's some normal python code:

```python
items = ...
for item in items:
  DoStuff(item)
```

And here's what it could look like if it understood plurals:

```python
items = ...
foreach item:
  DoStuff(item)
```

The idea is that `item` would get pluralized to `items`, so there's no need to specify the collection that's being looped through. The lnguage could figure it out from the singular!

Here's another example, with nested loops:

```python
data = ...
boxen = ...
codices = ...

foreach datum:
  foreach box:
    foreach codex:
      DoStuff(item,box,codex)
```
