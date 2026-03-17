import XCTest
@testable import SwiftIOSFixture

class PostTests: XCTestCase {

    func testPostInitialization() {
        let post = Post(
            id: "1",
            authorId: "author-1",
            title: "Test Post",
            body: "This is a test post body",
            createdAt: Date(),
            tags: ["swift", "testing"]
        )

        XCTAssertEqual(post.id, "1")
        XCTAssertEqual(post.authorId, "author-1")
        XCTAssertEqual(post.title, "Test Post")
        XCTAssertEqual(post.tags.count, 2)
    }

    func testPreviewTruncatesLongBody() {
        let longBody = String(repeating: "a", count: 200)
        let post = Post(
            id: "1",
            authorId: "author-1",
            title: "Long Post",
            body: longBody,
            createdAt: Date(),
            tags: []
        )
        XCTAssertEqual(post.preview.count, 100)
    }

    func testPreviewReturnsFullBodyWhenShort() {
        let shortBody = "Short body"
        let post = Post(
            id: "1",
            authorId: "author-1",
            title: "Short Post",
            body: shortBody,
            createdAt: Date(),
            tags: []
        )
        XCTAssertEqual(post.preview, shortBody)
    }

    func testPostEquality() {
        let date = Date()
        let post1 = Post(id: "1", authorId: "a", title: "T", body: "B", createdAt: date, tags: [])
        let post2 = Post(id: "1", authorId: "a", title: "T", body: "B", createdAt: date, tags: [])
        XCTAssertEqual(post1, post2)
    }

    func testPostCodable() throws {
        let post = Post(
            id: "1",
            authorId: "author-1",
            title: "Test",
            body: "Body",
            createdAt: Date(),
            tags: ["swift"]
        )

        let data = try JSONEncoder().encode(post)
        let decoded = try JSONDecoder().decode(Post.self, from: data)
        XCTAssertEqual(decoded.id, post.id)
        XCTAssertEqual(decoded.title, post.title)
    }
}
