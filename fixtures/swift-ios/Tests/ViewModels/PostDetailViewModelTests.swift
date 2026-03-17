import XCTest
import Combine
@testable import SwiftIOSFixture

class PostDetailViewModelTests: XCTestCase {

    var sut: PostDetailViewModel!
    var mockPostService: PostService!
    var mockNetworkManager: NetworkManager!
    var cancellables = Set<AnyCancellable>()

    override func setUpWithError() throws {
        mockNetworkManager = NetworkManager(baseURL: "https://test.api.com")
        mockPostService = PostService(networkManager: mockNetworkManager)
        sut = PostDetailViewModel(postId: "test-post-1", postService: mockPostService)
    }

    override func tearDownWithError() throws {
        sut = nil
        mockPostService = nil
        mockNetworkManager = nil
        cancellables.removeAll()
    }

    func testViewModelInitialization() {
        XCTAssertNotNil(sut)
        XCTAssertNil(sut.post)
        XCTAssertNil(sut.author)
        XCTAssertFalse(sut.isLoading)
        XCTAssertNil(sut.errorMessage)
    }

    func testLoadDataSetsLoadingState() async {
        await sut.loadData()
        XCTAssertFalse(sut.isLoading)
    }

    func testDeletePostWithNoPost() async {
        sut.post = nil
        await sut.deletePost()
        // Should return early without error
        XCTAssertNil(sut.errorMessage)
    }

    func testNotificationUpdatesPost() {
        let expectation = expectation(description: "Post updated via notification")

        sut.$post
            .dropFirst()
            .sink { post in
                if post == nil {
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)

        NotificationCenter.default.post(
            name: .dataDidUpdate,
            object: nil,
            userInfo: [
                "type": "posts",
                "action": "delete",
                "id": "test-post-1"
            ]
        )

        wait(for: [expectation], timeout: 2.0)
    }
}
