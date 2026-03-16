import Foundation

enum LogLevel: String {
    case debug = "DEBUG"
    case info = "INFO"
    case warning = "WARNING"
    case error = "ERROR"
}

class Logger {
    static let shared = Logger()

    private var isEnabled = true
    private var minLogLevel: LogLevel = .debug

    private init() {}

    func log(_ message: String, level: LogLevel = .info, file: String = #file, function: String = #function, line: Int = #line) {
        guard isEnabled else { return }
        guard shouldLog(level: level) else { return }

        let fileName = (file as NSString).lastPathComponent
        let timestamp = DateFormatter.logTimestamp.string(from: Date())

        let logMessage = "[\(timestamp)] [\(level.rawValue)] [\(fileName):\(line)] \(function) - \(message)"
        print(logMessage)
    }

    func setEnabled(_ enabled: Bool) {
        isEnabled = enabled
    }

    func setMinLogLevel(_ level: LogLevel) {
        minLogLevel = level
    }

    private func shouldLog(level: LogLevel) -> Bool {
        let levels: [LogLevel] = [.debug, .info, .warning, .error]
        guard let currentIndex = levels.firstIndex(of: level),
              let minIndex = levels.firstIndex(of: minLogLevel) else {
            return true
        }
        return currentIndex >= minIndex
    }
}

extension DateFormatter {
    static let logTimestamp: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"
        return formatter
    }()
}
