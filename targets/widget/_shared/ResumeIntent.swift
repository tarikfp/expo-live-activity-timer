import AppIntents
import WidgetKit

@available(iOS 16.2, *)
struct ResumeIntent: AppIntent, LiveActivityIntent {
    static var title: LocalizedStringResource = "Resume Timer"
    static var description: IntentDescription = "Resumes the current timer."

    // Ensure we can initialize from protocol
    init() {}

    func perform() async throws -> some IntentResult {
        // Notify the app to resume the timer
        NotificationCenter.default.post(name: Notification.Name("resumeTimerFromWidget"), object: nil)
        return .result()
    }
}
