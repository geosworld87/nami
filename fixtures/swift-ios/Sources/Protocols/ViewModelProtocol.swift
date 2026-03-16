import Foundation
import Combine

protocol ViewModelProtocol: ObservableObject {
    var isLoading: Bool { get set }
    var errorMessage: String? { get set }
    func loadData() async
}
