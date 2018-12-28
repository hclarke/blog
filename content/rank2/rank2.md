Title: Rank 2 Greenspunning
Date: 2018-12-26 20:00 
Tags: blag 
Category: blag 
Slug: rank2 
Summary: hacking rank 2 types into C#
Status: draft

With every sufficiently large C# project, there's a problem I inevitably run into: I want to call a generic function, but I've thrown out the type by casting to a base class/interface.

<img src="https://upload.wikimedia.org/wikipedia/commons/9/92/Philip_Greenspun_and_Alex_the_dog.jpg" 
     style="display:block;margin-left:auto;margin-right:auto;width: 50%;">
     
> Greenspun’s Tenth Rule: Any sufficiently complicated C or Fortran program contains an ad hoc informally-specified bug-ridden slow implementation of half of Common Lisp.

Haskell's solution to this problem is [Existential Types](https://wiki.haskell.org/Existential_type) and [Rank 2 Functions](https://wiki.haskell.org/Rank-N_types) (don't worry if those are clear as mud), so I'll be shoehorning a half-baked version into C#

If you know the [visitor pattern](https://en.wikipedia.org/wiki/Visitor_pattern), this should look familiar, except with generic methods on the visitor.

# What's a Rank 2 Function?

note: I'll be using `delegate` and `function` more or less interchangeably. C#'s way of doing [first-class functions]() is with delegates (a method pointer + a target object, wrapped up in a `Delegate` object). you can get a delegate by casting a Method to a delegate type, or with a lambda expression, or a few other more cumbersome ways.

First, it helps to know what Rank 0 and 1 types are. They more or less correspond to types, and generic types, respectively

## rank-0 types 

these are all your plain old types. `int`, `bool`, etc.

Also, any non-generic class, or any generic type with all of the generic parameters filled in. `List<int>`

And a rank-0 function type is a function type that is rank-0, and a rank-0 function is an instance of that type.

```C#
delegate string SomeRank0Function(int arg);
```

if C# didn't have delegates built in, you could use interfaces to define your own, and get the same result, but a lot more verbose:

```
interface SomeRank0Function {
	string Invoke(int arg);
}
```

## rank-1 types

These are generics. They have type parameters that haven't been filled in yet.

They have type parameters in the angle brackets after their name, and they use the type parameters in the body

Rank-1 function types have generic parameters in the angle brackets, and use those type parameters in the arguments and return type

```
delegate Result Rank1Function<T,Result>(T arg);
```

and if c# didn't already have them build in, you could define them as:

```
interface Rank1Function<T,Result> {
	Result Invoke(T arg);
}
```

## rank-2 types

Rank-2 types have type variables in the body that don't appear in the angle brackets after the type name.

The only C# types that are like this are classes/structs with generic methods: the generic method's type parameter belongs to the method, not to the class.

with some imaginary syntax, perhaps a C# Rank2 delegate would look like this, signifying that the `Arg` type parameter doesn't belong to the delegate, it belongs inside of it:

```
delegate void Rank2Function(<T>T arg);
```

and a function that takes one and does something with it:

```
void DoRank2Stuff(Rank2Function f) {
	//note: because the type variable is inside, we can pass multiple types as arguments
	f(1);
	f("a string!");
	f(10.1m);
}
```

sticking with the theme, here's an interface version of that Rank-2 delegate:

```
interface Rank2Function {
	void Invoke<T>(T arg);
}
```

Notice that the type parameter is inside the body of the class, not outside.

## It's a pattern

There's more than one "shape" for Rank-2 functions, just like there's more than one delegate type.

you can have one where the argument satisfies some constraints:

```
interface Rank2Action<Base> {
	void Invoke<T>(T arg) where T:struct,Base;
}
```


You can have one with a return value:

```
interface Rank2Func<Base,Result> {
	Result Invoke<T>(T arg) where T:struct,Base;
}
```

one with a ref parameter:

```
interface Rank2ByRef<Base> {
	void Invoke<T>(ref T arg) where T:struct,Base;
}
```

etc.

# Existential types

On their own, Rank-2 functions still aren't very useful. That's where Existential types come in.

An existential type is a type that exists, but you don't know what it is at compile-time. For the C# implementation, it's going to have to know about the Rank-2 functions it's compatible with.

Again, it's a pattern. There's one for just a type, there's one for a type and a value of that type, there's one for a type and an array of that type, etc.

here's an example:

```
interface IRank2Func<Base,Arg,Result> {
	Result Invoke<T>(T value, Arg arg) where T:struct,Base;
}

interface IExistentialValue<Base> {
	Result Accept<Arg,Result>(IRank2Func<Base,Arg,Result> func, Arg arg);
}

struct ExistentialValue<Base,T> : IExistentialValue<Base> where T:struct,Base {
	T value;
	public ExistentialValue(T value) {
		this.value = value;
	}
	Result Accept<Arg,Result>(IRank2Func<Base,Arg,Result> func, Arg arg) {
		return func.Invoke(value, arg);
	}
}
```

# An Example

Suppose you have a dog type:

<img src="https://upload.wikimedia.org/wikipedia/commons/3/3d/Longdog.jpg" 
	style="display:block;margin-left:auto;margin-right:auto;width: 50%;">
```
interface IDog {
	bool IsGood { get; }
	float Loyalty { get; }
	void Pet(float vigor);
}
```



And some implementations:

```
struct LongDog : IDog {
	float shaggyness,length;

	public LongDog(float shagginess, float length) {
		this.shagginess = shagginess;
		this.length = length;
	}
	public bool IsGood => true;
	public float Loyalty => shagginess * 0.25f + 0.6f;
	public void Pet(float vigor) {
		//...
	}
}

struct GoldenRetriever : IDog {
	DateTime lastFed;

	public GoldenRetreiver(DateTime lastFed) {
		this.lastFed = lastFed;
	}
	public bool IsGood => true;
	public float Loyalty {
		get {
			var elapsed = (DateTime.Now - lastFed).TotalMinutes;
			return elapsed > 5.0 ? 0.3 : 0.9;
		}
	}
	public void Pet(float vigor) {
		//...
	}
}

//etc.
```

## A List

Now, let's say you want to put these good boys in a linked list. You might try a linked list something like this:

<img src="{dirname}/linked.jpg" style="display:block;margin-left:auto;margin-right:auto;width: 80%;">
```
class Node {
	public IDog dog;
	public Node next;
}
```

But there's a potential problem: the `data` field is a pointer. Sometimes that's fine, but it's inefficient!

## A cozier list

It'd be more efficient if the data was held in the node, and only `Next` was a pointer. The dogs are structs, after all.

So, let's try again. this time, using an interface for the node type:


<img src="{dirname}/structs.jpg" style="display:block;margin-left:auto;margin-right:auto;width: 80%;">
```
interface INode {
	INode Next { get; set; }
}

class Node<T> : INode where T:struct,IDog {
	public T dog;
	public INode Next { get; set; }
}
```

this fixes the packing problem, but now you can't access the dogs through the interface. You can only walk past, knowing they're there, but out of reach.

## Rank 2 solution

This is where the Rank-2 functions come in. We'll add an `Accept` function to the list, which lets us pass a rank-2 function in and do something with the first dog. The Node fills the role of Existential type:

```
interface IDogFunc<Arg,Result> {
	Result Invoke<T>(ref T dog, Arg arg) where T:struct,IDog;
}

interface INode {
	INode Next { get; set; }

	Result Accept<Arg,Result>(IRank2Func<IDog,Arg,Result> func, Arg arg);
}

class Node<T> : INode where T:struct,IDog {
	public T dog;
	public INode Next { get; set; }

	public Result Accept<Arg,Result>(IRank2Func<IDog,Arg,Result> func, Arg arg) {
		return func.Invoke(ref dog, arg);
	}
}
```

We can now implement functions over the list. Here's a copy function:

```

INode Copy(INode list) {
	if(list == null) {
		return null;
	}
	var head = list.Accept(CopyNode.instance, default);
	head.Next = Copy(list.Next);
	return head;
}


struct _ {} //empty struct to represent "void" or "unused"

class CopyNode : IDogFunc<_, INode> {
	public static readonly CopyNode instance = new CopyNode();
	public INode Invoke<T>(ref T dog, _ _) where T:struct,IDog {
		return new Node<T>{
			dog = dog,
		}
	}
}
```

or the `PetAll` function:

```
void PetAll(INode dogs, float vigor) {
	for(var node = dogs; node != null; node = node.Next) {
		node.Accept(PetDog.instance, vigor);
	}
}


class PetDog : IDogFunc<float, _> {
	public static readonly PetDog instance = new PetDog();
	_ Invoke<T>(ref T dog, float vigor) where T:struct,IDog {
		dog.Pet(vigor);
		return default;
	}
}
```

# Fin

Like most design patterns, this isn't the prettiest code, but it helps solve a problem that C# is otherwise lacking a solution for. Used sparingly, it can make more efficient generic code possible.
