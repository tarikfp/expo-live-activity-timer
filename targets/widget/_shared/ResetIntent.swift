import AppIntents
import WidgetKit

@available(iOS 16.2, *)
struct ResetIntent: AppIntent, LiveActivityIntent {
    static var title: LocalizedStringResource = "Reset Timer"
    static var description: IntentDescription = "Resets the current timer."

    init() {}

    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(name: Notification.Name("resetTimerFromWidget"), object: nil)
        return .result()
    }
}
