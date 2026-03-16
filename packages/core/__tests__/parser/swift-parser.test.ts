import { describe, it, expect } from "vitest";
import { SwiftParser } from "../../src/parser/swift/index.js";
import type { GraphEdge, GraphNode } from "../../src/graph/model.js";

const parser = new SwiftParser();

function parse(code: string, filePath = "Test.swift") {
  return parser.parseFile(filePath, code, "/repo");
}

function findNode(nodes: GraphNode[], name: string) {
  return nodes.find((n) => n.name === name);
}

function findEdge(edges: GraphEdge[], kind: string, target?: string) {
  return edges.find(
    (e) => e.kind === kind && (target === undefined || e.target.includes(target)),
  );
}

function findEdges(edges: GraphEdge[], kind: string) {
  return edges.filter((e) => e.kind === kind);
}

describe("SwiftParser", () => {
  it("has correct language and extensions", () => {
    expect(parser.language).toBe("swift");
    expect(parser.extensions).toEqual([".swift"]);
  });

  it("always creates a file node", () => {
    const { nodes } = parse("");
    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe("file");
    expect(nodes[0].filePath).toBe("Test.swift");
  });

  describe("imports", () => {
    it("extracts import statements", () => {
      const { edges } = parse(`
import Foundation
import UIKit
`);
      const imports = findEdges(edges, "imports");
      expect(imports).toHaveLength(2);
      expect(imports[0].target).toBe("Foundation");
      expect(imports[1].target).toBe("UIKit");
    });
  });

  describe("type declarations", () => {
    it("extracts class declaration", () => {
      const { nodes, edges } = parse(`
class UserService {
    var name: String = ""
    func fetch() {}
}
`);
      const classNode = findNode(nodes, "UserService");
      expect(classNode).toBeDefined();
      expect(classNode!.kind).toBe("class");
      expect(classNode!.metadata.methodCount).toBe(1);
      expect(classNode!.metadata.propertyCount).toBe(1);

      const declares = findEdge(edges, "declares", "UserService");
      expect(declares).toBeDefined();
    });

    it("extracts struct declaration", () => {
      const { nodes } = parse(`
struct User: Codable {
    let id: String
    let name: String
}
`);
      const structNode = findNode(nodes, "User");
      expect(structNode).toBeDefined();
      expect(structNode!.kind).toBe("struct");
      expect(structNode!.metadata.propertyCount).toBe(2);
    });

    it("extracts enum declaration", () => {
      const { nodes } = parse(`
enum Direction {
    case north
    case south
}
`);
      const enumNode = findNode(nodes, "Direction");
      expect(enumNode).toBeDefined();
      expect(enumNode!.kind).toBe("enum");
    });

    it("extracts protocol declaration", () => {
      const { nodes } = parse(`
protocol DataServiceProtocol {
    func fetchAll() -> [String]
    func fetchById(_ id: String) -> String?
}
`);
      const protoNode = findNode(nodes, "DataServiceProtocol");
      expect(protoNode).toBeDefined();
      expect(protoNode!.kind).toBe("protocol");
      expect(protoNode!.metadata.methodCount).toBe(2);
    });

    it("extracts extension", () => {
      const { nodes } = parse(`
extension String {
    func trimmed() -> String { return self }
}
`);
      const extNode = findNode(nodes, "String");
      expect(extNode).toBeDefined();
      expect(extNode!.kind).toBe("extension");
    });
  });

  describe("inheritance and conformance", () => {
    it("extracts protocol conformance", () => {
      const { edges } = parse(`
class AuthService: AuthServiceProtocol {
}
`);
      const conformance = findEdge(edges, "conforms_to", "AuthServiceProtocol");
      expect(conformance).toBeDefined();
    });

    it("extracts multiple conformances", () => {
      const { edges } = parse(`
class MyClass: UIViewController, MyProtocol {
}
`);
      const conformances = findEdges(edges, "conforms_to");
      expect(conformances.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("delegate pattern", () => {
    it("detects delegate property", () => {
      const { edges } = parse(`
class ProfileVC {
    weak var delegate: ProfileDelegate?
}
`);
      const delegateEdge = findEdge(edges, "delegates_to", "ProfileDelegate");
      expect(delegateEdge).toBeDefined();
    });
  });

  describe("dependency injection", () => {
    it("detects init parameter injection", () => {
      const { edges } = parse(`
class UserListViewModel {
    init(service: DataServiceProtocol) {
    }
}
`);
      const inject = findEdge(edges, "injects", "DataServiceProtocol");
      expect(inject).toBeDefined();
    });
  });

  describe("NotificationCenter patterns", () => {
    it("detects NotificationCenter.post", () => {
      const { edges } = parse(`
class AuthService {
    func login() {
        NotificationCenter.default.post(name: .userDidLogin, object: nil)
    }
}
`);
      const publishes = findEdge(edges, "publishes");
      expect(publishes).toBeDefined();
    });

    it("detects NotificationCenter.addObserver", () => {
      const { edges } = parse(`
class MainController {
    func setup() {
        NotificationCenter.default.addObserver(self, selector: #selector(handle), name: .userDidLogin, object: nil)
    }
}
`);
      const observes = findEdge(edges, "observes");
      expect(observes).toBeDefined();
    });
  });

  describe("Combine patterns", () => {
    it("detects @Published properties", () => {
      const { edges } = parse(`
class AuthViewModel {
    @Published var isAuthenticated: Bool = false
}
`);
      const publishes = findEdge(edges, "publishes");
      expect(publishes).toBeDefined();
    });
  });

  describe("method calls", () => {
    it("detects method calls on objects", () => {
      const { edges } = parse(`
class UserListViewModel {
    func loadData() {
        service.fetchAll()
    }
}
`);
      const calls = findEdge(edges, "calls", "service");
      expect(calls).toBeDefined();
    });
  });

  describe("type references", () => {
    it("detects property type references", () => {
      const { edges } = parse(`
class UserService {
    var networkManager: NetworkManager?
}
`);
      const ref = findEdge(edges, "references", "NetworkManager");
      expect(ref).toBeDefined();
    });
  });
});
