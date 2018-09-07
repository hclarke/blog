Title: rust simplifies fizzbuzz
Date: 2018-09-07 14:00
Tags: blag
Category: blag
Slug: rust-fizzbuzz
Summary: rust language construct makes annoying code less annoying
Status: draft

If you've written a [FizzBuzz]() program, you probably noticed that the cases don't simplify nicely. It's such a small program, but there's duplicated code that's difficult to get rid of.

Rust's match statements are good for simplifying this sort of thing.

[*disclaimer: this is rust evangelism, not a suggestion on answering interview questions*]

# Problem

```
for integers 1 to n, print the integer.
If the integer is divisible by 3, print "Fizz" instead
If it's divisible by 5, print "Buzz" instead
If it's divisible by 3 and 5, print "FizzBuzz" instead
```

# Tired solution

A typical solition is:

```

fn fizz_buzz(n : usize) {
  for i in 1..n+1 {
    if (i%3 == 0) && (i%5 == 0) {
      println!("FizzBuzz");
    }
    else if i%3 == 0 {
      println!("Fizz");
    }
    else if i%5 == 0 {
      println!("Buzz");
    }
    else {
      println!("{}", i);
    }
  }
}
```

If you're like me, this solution feels like wearing an old wool sweater: It gets the job done efficiently, but it's itchy. The divisibility checks are duplicated, and storing them in variables doesn't make it any nicer.

# Wired solution

It gets a bit nicer with a rust `match` statement, which lets you pack both divisibility checks into a tuple, and enumerate all 4 cases without the clutter of nested `if`s or repeated checks. It should compile to more or less the same thing as the itchy solution:

[*note: `_` matches anything*]

```
fn fizz_buzz(n : usize) {
  for i in 1..n+1 {
    match (i%3,i%5) {
      (0,0) => println!("FizzBuzz"), //bonus: the pattern looks like an owl
      (0,_) => println!("Fizz"),
      (_,0) => println!("Buzz"),
      (_,_) => println!("{}", i),
    }
  }
}
```

Or, by noticing that you can solve the problem manually for 15 cases and loop through them, you can use rust's "or" patterns:

```
fn fizz_buzz(n : usize) {
  for i in 1..n+1 {
    match i%15 {
        3|6|9|12 => println!("Fizz"),
        5|10     => println!("Buzz"),
        0        => println!("FizzBuzz"),
        _        => println!("{}", i),
    }
  }
}
```
