import Foundation

struct Post: Codable, Equatable {
    let id: String
    let authorId: String
    let title: String
    let body: String
    let createdAt: Date
    let tags: [String]

    var preview: String {
        String(body.prefix(100))
    }
}
