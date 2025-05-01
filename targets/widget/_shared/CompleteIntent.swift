import AppIntents
import WidgetKit

@available(iOS 16.2, *)
struct CompleteIntent: AppIntent, LiveActivityIntent {
    static var title: LocalizedStringResource = "Complete Exercise"
    static var description: IntentDescription = "Opens the app to complete the exercise"
    static var openAppWhenRun: Bool = true

    init() {}
    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(name: Notification.Name("completeActivityFromWidget"), object: nil)

        return .result()
    }
}
