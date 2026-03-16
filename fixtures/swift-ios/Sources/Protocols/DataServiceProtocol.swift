import Foundation

protocol DataServiceProtocol {
    associatedtype T: Codable
    func fetchAll() async throws -> [T]
    func fetchById(_ id: String) async throws -> T?
    func create(_ item: T) async throws -> T
    func delete(_ id: String) async throws
}
