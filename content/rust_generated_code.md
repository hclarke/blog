Title: Generated code in Rust
Date: 2017-03-01 23:00
Tags: blag
Category: blag
Slug: generated-code-in-rust
Summary: generate rust code in a build script

I was recently using protocol buffers, which use a code generator. The basic idea is that you make a .proto file, and pass it to protoc, which generates code for your target languate (in this case, rust).

I could have just ran protoc manually, and put the output in my src folder. But that's not very pleasant if I want to modify or add more protocol buffer descriptions later. I'd rather keep the .proto files in the project, and generate the .rs files at build time.


----

First, we need to point ```cargo.toml``` at a build script

```
//cargo.toml
[paackage]
build = "build.rs"
...
```

Then there's the build script. It has to find the .proto file, and use protoc to generate a .rs file in the build directory (a dir cargo generates for build scripts to write files to).

There's an extra complication, though. The way to use a build script generated file in your program is to ```include!()``` it from your src dir, but it [breaks if the included file has top level attributes](https://github.com/rust-lang/rust/issues/18810), which the protocol buffer files do have. The path attribute on mod items would be nice, but you [can't use macros in attributes](https://github.com/rust-lang/rust/issues/18849), so that won't work either.

To get around it, I'm generating a second file that just has a mod item with a path attribute, and include!ing that instead. It's ugly, but it works.

```
//build.rs
use std::env;
use std::path::PathBuf;
use std::process::Command;
use std::fs::File;
use std::io::Write;

fn main() {
	//project folder
    let root = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    //project/proto, where the .proto files are
    let source = root.join("proto");

    //cargo-generated dir for build script to output to
    let out = PathBuf::from(env::var("OUT_DIR").unwrap());

    //build a rust file for example.proto
    build_proto(&source, &out, "example");
}

fn build_proto(src_dir : &PathBuf, dst_dir : &PathBuf, name : &str) {
	let name_buf = PathBuf::from(name);
	//generate rust code from .proto file
	let res = Command::new("protoc")
		.current_dir(src_dir)
		.arg("--rust_out")
		.arg(dst_dir)
		.arg(name_buf.with_extension("proto"))
		.status()
		.unwrap();

	assert!(res.success());

	//HACK: workaround for issue #18810/#18849

	//BUILD_DIR/name.mod
	let wrapper_path = dst_dir.join(name).with_extension("mod");
	//BUILD_DIR/name.rs
	let mod_path = dst_dir.join(name).with_extension("rs");

	let mut f = File::create(wrapper_path).unwrap();

	//#[path = "BUILD_DIR/name.rs"]
	//pub mod name;
	write!(f, "#[path = \"{}\"]\npub mod {};", mod_path.to_string_lossy(),name);
}
```


And finally, the line in lib.rs (or some other rust file in src)

```
//src/lib.rs

include!(concat!(env!("OUT_DIR"), "/example.mod"));

```

----

And that's it. Generated code up and running!
