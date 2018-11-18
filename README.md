# light-api-doc

Lightweight API documentation generator.

Instead of having a rigid syntax like many other documentation generators
**light-api-doc** emphasizes free-form expression. The documentation is
generated from comments with minimal `@tags` and a template markdown file.

## Example

```js
// @api GET /users
// Returns a list of all the users @json {
//   "users": [{
//     "id": 123,
//     "name": "Some user"
//   }, ...],
// }
// 
app.get('/users', ...)
```

```md
## Users

These endpoints let you query information about the users. The API is protected
and needs authorization to use. All user endpoints fail with **403 Forbidden** if 
a valid authorization token is missing.

@api /users
```

