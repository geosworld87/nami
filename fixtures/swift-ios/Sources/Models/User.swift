import Foundation

struct User: Codable, Equatable {
    let id: String
    let name: String
    let email: String
    let avatarURL: URL?
    let createdAt: Date

    var displayName: String {
        name.isEmpty ? email : name
    }
}
