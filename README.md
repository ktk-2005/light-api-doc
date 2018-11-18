# light-api-doc

Lightweight API documentation generator.

Instead of having a rigid syntax like many other documentation generators
**light-api-doc** emphasizes free-form expression. The documentation is
generated from comments with minimal `@tags` and a template markdown file.

## Example

**api/users.js**
```js
// @api GET /users
// Returns a list of all the users @json {
//   "users": [{
//     "id": 123,
//     "name": "Some user"
//   }, ...],
// }
app.get('/users', ...)
```

**misc/api-template.md**
```md
## Users

These endpoints let you query information about the users. The API is protected
and needs authorization to use. All user endpoints fail with **403 Forbidden** if 
a valid authorization token is missing.

@api /users
```

## Usage

The tool is used from the command line:

```bash
light-api-doc -t template.md -o output.md src
```

For more information about the options run it with `--help`.

## Code comment syntax

To start describing an endpoint start with a comment with `@api method path`.
The following comments are interpreted as markdown describing the endpoint.
The implementation of the endpoint should follow the comment block for documentation
link correctness.

```js
// @api METHOD /path/to/endpoint
// Description of the endpoint
app.method('/path/to/endpoint/', ...)
```

You can use any Markdown features in the comment but there are shorthands.

### Shorthands

There is a compact JSON block notation using `@json {`.

```md
Example of a JSON block @json {
  "key": "value"
}
Text following the JSON block

-- Expands into (with triple `):

Example of a JSON block
``json
{
  "key": "value"
}
``
Text following the JSON block
```

