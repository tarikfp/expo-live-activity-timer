import AppIntents
import WidgetKit

@available(iOS 16.2, *)
struct PauseIntent: AppIntent, LiveActivityIntent {
    static var title: LocalizedStringResource = "Pause Timer"
    static var description: IntentDescription = "Pauses the current timer."

    init() {}

    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(name: Notification.Name("pauseTimerFromWidget"), object: nil)
        return .result()
    }
}
