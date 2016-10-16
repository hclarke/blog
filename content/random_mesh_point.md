Title: Random point on a mesh
Date: 2016-10-16 13:30
Tags: gamedev, math
Category: blag
Slug: random-mesh-point
Summary: finding a uniformly random point on a mesh

A while ago, I needed to find uniformly random points on a triangle mesh to emit particles (water drops in a cave). Well, need is a strong word; I'm sure there are plenty of clever hacks that would've produced a visually good enough result. The problem is simple enough to explore in a blog post, covers some interesting problems, and is something I've actually used in production, so i thought I'd share.

## What's the problem?

We have a mesh, which is a set of triangles in 3d space, and we want a uniformly random point from that set of triangles.

In this case, the mesh is an array of 3d points , and an array of triples of indices into that array of points.

Here's our mesh (and simple vector definitions) in rust code:

~~~~
use std::ops::*;
use std::mem::*;


type int3 = (usize,usize,usize);
#[derive(Copy,Clone)]
struct float3(f32,f32,f32);

struct Mesh {
  verts : Vec<float3>,
  tris : Vec<int3>,
}

impl float3 {
  fn dot(self, rhs:float3) -> f32 {
    self.0*rhs.0 + self.1*rhs.1 + self.2*rhs.2
  }
  fn cross(self, rhs:float3) -> float3 {
    float3(
      self.1*rhs.2-self.2*rhs.1, 
      self.2*rhs.0-self.0*rhs.2, 
      self.0*rhs.1-self.1*rhs.0)
  }
}
impl Add for float3 {
  type Output = float3;
  fn add(self, rhs : float3) -> float3 {
    float3(self.0+rhs.0, self.1+rhs.1, self.2+rhs.2)
  }
}
impl Sub for float3 {
  type Output = float3;
  fn sub(self, rhs : float3) -> float3 {
    float3(self.0-rhs.0, self.1-rhs.1, self.2-rhs.2)
  }
}
impl Mul<f32> for float3 {
  type Output = float3;
  fn mul(self, rhs : f32) -> float3 {
    float3(self.0*rhs, self.1*rhs, self.2*rhs)
  }
}
~~~~

## Random numbers

The first problem we need to solve is how to get a (pseudo)random number. There are whole bunch of ways to do this, but we're going to use [xoroshiro+](http://xoroshiro.di.unimi.it/), because it's fast, simple to implement, and holds up well to both statistical analysis and eyeballing the output. A linear congruential generator will also work, as long as its state is large enough and you pick the constants well.

~~~~
struct RandState { a:u64, b:u64 }

impl RandState {

  fn get_u64(&mut self) -> u64 {
    let a = self.a;
    let b = self.b;
    let r = a.wrapping_add(b);
    let c = a^b;
    
    self.a = a.rotate_left(55) ^ c ^ (c<<14);
    self.b = b.rotate_left(36);
    
    r
  }


  fn new() -> RandState {
    let mut s = RandState { a:1, b:0 };
    for _ in 0..128 { //iterate a few times for a better start
      s.get_u64();
    }
    s
  }
}
~~~~

## Floating point

We'll also need to be able to convert the 64 bit result into a floating point value between 0 and 1. To do that, we can use some bit twiddling with the floating point representation to map it to the 1 to 2 range, and then subtract 1. Inigo Quilez has a post with more details [here](http://www.iquilezles.org/www/articles/sfrand/sfrand.htm), but the basic idea is:

 - set the mantissa to random bits
 - set the sign to 0 positive
 - set the exponent to 0
 - subtract 1.0

~~~~
impl RandState {}

  fn get_f64(&mut self) -> f64 {
    const exp  : u64 = 0x3FF0000000000000u64; //sign and exponent value
    const mask : u64 = 0x000FFFFFFFFFFFFFu64; //mantissa mask
    let r = self.get_u64();
    unsafe {
      let r : f64 = transmute((r&mask)|exp);
      r - 1.0
    }
  }

  fn get_f32s(&mut self) -> (f32,f32) {
    const exp  : u64 = 0x3F8000003F800000u64;
    const mask : u64 = 0x007FFFFF007FFFFFu64;
    let r = self.get_u64();
    unsafe {
      let r : (f32,f32) = transmute((r&mask)|exp);
      (r.0-1.0,r.1-1.0)
    }
  }
}
~~~~



## A single triangle

If we're going to get a random point on a mesh, we'll want to know how to get a random point on a single triangle.

There's a property that's going to help us a lot here: affine transformations preserve barycentric coordinates. So, if we get a uniformly random point on one triangle, we can transform it into a uniformly random point on another triangle (proof left to the reader). If we can find a triangle that's easy to generate points in, we can just map that to our actual triangle.

Specifically, that easy triangle is (0,0) (0,1) (1,0). We can generate a point in the square from (0,0) to (1,1), and if it's in the wrong half of the square, flip it across the diagonal.

~~~~
impl RandState {
  fn get_barycentric(&mut self) -> float3 {
    let mut r = self.get_f32s();
    if r.0+r.1 > 1.0 {
      r.0 = 1.0 - r.0;
      r.1 = 1.0 - r.1;
    }
    float3(r.0, r.1, 1.0-r.0-r.1)
  }

  fn get_in_triangle(&mut self, a : float3, b : float3, c : float3) -> float3 {
    let r = self.get_barycentric();
    a * r.0 + b*r.1 + c*r.2
  }
}
~~~~

## Finding the right triangle

Each triangle should have probability proportional to its area, so that a uniformly random point on a random triangle is a uniformly random point on the mesh.

A trick so that we can do it in one pass: suppose we have two sets of weighted elements (A and B). if we want a random element from the combined set, it should be in A with weight of the sum of weights in A, and B with weight of the sum of weights in B. We can use this fact by going through the array and at each element, checking if we should keep the random element from the previous part of the array (with weight of the sum of those elements), or picking the current element (with its weight). 


~~~~
impl RandState {
    fn get_on_surface(&mut self, mesh : &Mesh) -> float3 {
      let tris = &mesh.tris;
      let verts = &mesh.verts;
    
      let mut total_area = 0f32;
      let zero = float3(0f32,0f32,0f32);
      let mut best = (zero,zero,zero);
    
      //get a random triangle, weighted by area
      for tri in tris {
        let (i,j,k) = *tri;
        let vi = verts[i]; 
        let vj = verts[j]; 
        let vk = verts[k];
    
        let c = (vj-vi).cross(vk-vi);
    
        let area = c.dot(c).sqrt();
        total_area += area;
    
        let r = self.get_f32s().0 * total_area;
        if r < area {
          best = (vi,vj,vk);
        }
      }
    
      self.get_in_triangle(best.0, best.1, best.2)
    }
}
~~~~

And now you have a random point on a mesh

## Notes

- to get a random float in \[-1,1\), set exponent to 1, subtract 3.0
- if your PRNG is slow, you can do a two-pass method to find the triangle with one PRNG call
- look at ChaCha20 for a good cryptographic PRNG
- look at [PCGs](http://www.pcg-random.org/) for good non-cryptographic PRNGs
- consider using only a vertex array and not an index array for better cache behaviour