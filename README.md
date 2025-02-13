# Smart Error Code Generator

Generate configurable error codes that can be used to identify the file and line number of the error.

## Commands

### Generate and Insert Error Code
Windows: `Ctrl+f1`\
Linux: `Ctrl+f1`\
Mac: `Cmd+f1`\
menu: right click -> `Generate Error Code`

Generate and insert error code at the current cursor position(s).

### Find Error Code
menu: right click -> `Find Error Code`

Find the location of the error code in the project.
the format shuld be given in {path}{line}. (line optional)\
*note that the relative path and code generation settings must be the same as when error was generated to find.*


## Extension Settings

a code is built with <path_hash><line_number>.

Eatch can seprretly be configured with difrent encodings and lengths.

Supported encodings:
- `hexadecimal`
- `decimal`
- `base36`