import SwiftUI

struct UserListView: View {
    @StateObject private var viewModel: UserListViewModel
    @State private var showingAddUser = false

    init(viewModel: UserListViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        NavigationView {
            Group {
                if viewModel.isLoading {
                    ProgressView("Loading users...")
                } else if let errorMessage = viewModel.errorMessage {
                    VStack {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.red)
                        Text(errorMessage)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding()
                        Button("Retry") {
                            Task {
                                await viewModel.loadData()
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                } else {
                    List {
                        ForEach(viewModel.filteredUsers, id: \.id) { user in
                            UserRowView(user: user)
                                .swipeActions {
                                    Button(role: .destructive) {
                                        Task {
                                            await viewModel.deleteUser(user)
                                        }
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
                        }
                    }
                    .searchable(text: $viewModel.searchText, prompt: "Search users")
                    .refreshable {
                        await viewModel.refreshUsers()
                    }
                }
            }
            .navigationTitle("Users")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddUser = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddUser) {
                Text("Add User View")
            }
        }
        .task {
            await viewModel.loadData()
        }
    }
}

struct UserRowView: View {
    let user: User

    var body: some View {
        HStack {
            Circle()
                .fill(Color.blue)
                .frame(width: 40, height: 40)
                .overlay {
                    Text(String(user.name.prefix(1)))
                        .foregroundColor(.white)
                        .font(.headline)
                }

            VStack(alignment: .leading) {
                Text(user.displayName)
                    .font(.headline)
                Text(user.email)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}
