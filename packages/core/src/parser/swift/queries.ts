// tree-sitter S-expression queries for Swift
// These are based on the tree-sitter-swift grammar (alex-pinkus)

// Note: In tree-sitter-swift, class/struct/enum/extension all use
// `class_declaration` as the node type. The first child keyword
// (`class`, `struct`, `enum`, `extension`) distinguishes them.

export const QUERIES = {
  // All type declarations (class, struct, enum, extension, protocol)
  // We extract the keyword + name from each
  classDeclaration: `(class_declaration
    name: (type_identifier) @name
  ) @decl`,

  protocolDeclaration: `(protocol_declaration
    name: (type_identifier) @name
  ) @decl`,

  // Import statements
  importDeclaration: `(import_declaration
    (identifier (simple_identifier) @module)
  )`,

  // Inheritance and protocol conformance
  inheritanceSpecifier: `(class_declaration
    name: (type_identifier) @class_name
    (inheritance_specifier
      inherits_from: (user_type (type_identifier) @parent_name)
    )
  )`,

  // Function declarations
  functionDeclaration: `(function_declaration
    name: (simple_identifier) @name
  ) @decl`,

  // Protocol function declarations
  protocolFunctionDeclaration: `(protocol_function_declaration
    name: (simple_identifier) @name
  ) @decl`,

  // Property declarations with type annotation
  propertyWithType: `(property_declaration
    name: (pattern bound_identifier: (simple_identifier) @prop_name)
    (type_annotation name: (_) @type_node)
  ) @decl`,

  // Init declarations (for DI detection)
  initDeclaration: `(init_declaration
    (parameter
      name: (simple_identifier) @param_name
      name: (user_type (type_identifier) @param_type)
    )
  ) @decl`,

  // Call expressions (for method call detection)
  callExpression: `(call_expression) @call`,

  // Enum entries
  enumEntry: `(enum_entry
    name: (simple_identifier) @name
  ) @decl`,
} as const;
