import ActivityKit
import WidgetKit
import SwiftUI
import Foundation

enum TimerState: String, Codable, Hashable {
    case active
    case paused
    case finished
}

func mapJSIconToSFSymbol(_ jsIcon: String) -> String {
    switch jsIcon.uppercased() {
    case "WALKING":
        return "figure.walk"
    case "RUNNING":
        return "figure.run"
    case "BIKING":
        return "bicycle"
    case "WORKOUT":
        return "dumbbell.fill"
    default:
        return "timer"
    }
}

struct LiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var startedAt: Date
        var pausedAt: Date?

        func getElapsedTimeInSeconds() -> TimeInterval {
            if let pausedAt = pausedAt {
                return pausedAt.timeIntervalSince(startedAt)
            } else {
                return Date().timeIntervalSince(startedAt)
            }
        }

        func isRunning() -> Bool {
            return pausedAt == nil
        }

        func getFormattedElapsedTime() -> String {
            let elapsed = getElapsedTimeInSeconds()
            let totalSeconds = Int(elapsed)
            let hours = totalSeconds / 3600
            let minutes = (totalSeconds % 3600) / 60
            let seconds = totalSeconds % 60

            if hours > 0 {
                return String(format: "%d:%02d:%02d", hours, minutes, seconds)
            } else {
                return String(format: "%d:%02d", minutes, seconds)
            }
        }

        func getFutureDate() -> Date {
            return Date().addingTimeInterval(365 * 24 * 60 * 60)
        }

    }

    var activityName: String
    var activityIcon: String
}

// Helper to create color from hex
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

struct LiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      LockScreenLiveActivityView(context: context)
      .activityBackgroundTint(Color.black)
      .activitySystemActionForegroundColor(Color(hex: "#007bff")) // Use theme color for system actions

    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
              ActivityIcon(activityIcon: mapJSIconToSFSymbol(context.attributes.activityIcon),
                          themeColor: .white,
                          size: 18)

              Text(context.attributes.activityName)
                .foregroundColor(.white)
                .font(.system(size: 16, weight: .semibold))
            }

            if !context.state.isRunning() {
              Text(context.state.getFormattedElapsedTime())
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .fontWeight(.medium)
                .monospacedDigit()
            } else {
              Text(timerInterval: context.state.startedAt...context.state.getFutureDate(),
                   pauseTime: nil,
                   countsDown: false,
                   showsHours: false)
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .fontWeight(.medium)
                .monospacedDigit()
            }
          }
          .padding(.leading, 8)
        }

        DynamicIslandExpandedRegion(.trailing) {
          VStack {
            Spacer() // Push content to bottom

            if context.state.isRunning() {
              Button(intent: PauseIntent()) {
                ZStack {
                  Circle()
                    .fill(Color(hex: "#007bff"))
                    .frame(width: 44, height: 44)
                  Image(systemName: "pause.fill")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
                }
              }
              .buttonStyle(PlainButtonStyle())
              .padding(.horizontal, 8)
            } else {
              HStack(spacing: 8) {
                Button(intent: CompleteIntent()) {
                  ZStack {
                    Circle()
                      .fill(Color(hex: "#28a745"))
                      .frame(width: 44, height: 44)
                    Image(systemName: "checkmark")
                      .font(.system(size: 16, weight: .bold))
                      .foregroundColor(.white)
                  }
                }
                .buttonStyle(PlainButtonStyle())

                Button(intent: ResumeIntent()) {
                  ZStack {
                    Circle()
                      .fill(Color(hex: "#007bff"))
                      .frame(width: 44, height: 44)
                    Image(systemName: "play.fill")
                      .font(.system(size: 18, weight: .bold))
                      .foregroundColor(.white)
                  }
                }
                .buttonStyle(PlainButtonStyle())
              }
            }
          }
          .frame(maxHeight: .infinity) // Ensure VStack takes full height
        }
      } compactLeading: {
        HStack(spacing: 4) {
          ActivityIcon(activityIcon: mapJSIconToSFSymbol(context.attributes.activityIcon),
                      themeColor: .white,
                      size: 16)

          Text(context.attributes.activityName)
            .foregroundColor(.white)
            .font(.system(size: 12))
            .lineLimit(1)
            .truncationMode(.tail)
        }
      } compactTrailing: {
        if !context.state.isRunning() {
          Text(context.state.getFormattedElapsedTime())
            .foregroundColor(.white)
            .monospacedDigit()
            .font(.system(size: 12, weight: .medium))
        } else {
          Text(timerInterval: context.state.startedAt...context.state.getFutureDate(),
               pauseTime: nil,
               countsDown: false,
               showsHours: false)
            .foregroundColor(.white)
            .monospacedDigit()
            .font(.system(size: 12, weight: .medium))
        }
      } minimal: {
        ActivityIcon(activityIcon: mapJSIconToSFSymbol(context.attributes.activityIcon),
                    themeColor: .white,
                    size: 12)
      }
    }
  }
}

// MARK: - Lock Screen View
struct LockScreenLiveActivityView: View {
  let context: ActivityViewContext<LiveActivityAttributes>

  var body: some View {
    ZStack {
      Color.black.opacity(0.8)
        .clipShape(RoundedRectangle(cornerRadius: 16))

      HStack(spacing: 16) {
        // Left side - timer info
        VStack(alignment: .leading, spacing: 12) {
          HStack(spacing: 8) {
            ActivityIcon(activityIcon: mapJSIconToSFSymbol(context.attributes.activityIcon),
                        themeColor: .white,
                        size: 18)

            Text(context.attributes.activityName)
              .font(.headline)
              .foregroundColor(.white)
          }

          VStack(alignment: .leading, spacing: 4) {
            if !context.state.isRunning() {
              Text(context.state.getFormattedElapsedTime())
                .font(.system(size: 34, weight: .semibold, design: .rounded))
                .foregroundColor(.white)
                .fontWeight(.medium)
                .monospacedDigit()
            } else {
              Text(timerInterval: context.state.startedAt...context.state.getFutureDate(),
                   pauseTime: nil,
                   countsDown: false,
                   showsHours: false)
                .font(.system(size: 34, weight: .semibold, design: .rounded))
                .foregroundColor(.white)
                .fontWeight(.medium)
                .monospacedDigit()
            }
          }
        }
        .frame(maxHeight: .infinity, alignment: .center)

        Spacer()

        // Right side - Buttons aligned to center vertically
        VStack {
          Spacer()

          if context.state.isRunning() {
            Button(intent: PauseIntent()) {
              ZStack {
                Circle()
                  .fill(Color(hex: "#007bff"))
                  .frame(width: 44, height: 44)
                Image(systemName: "pause.fill")
                  .font(.system(size: 18, weight: .bold))
                  .foregroundColor(.white)
              }
            }
            .buttonStyle(PlainButtonStyle())
          } else {
            HStack(spacing: 8) {
              Button(intent: CompleteIntent()) {
                ZStack {
                  Circle()
                    .fill(Color(hex: "#28a745"))
                    .frame(width: 44, height: 44)
                  Image(systemName: "checkmark")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                }
              }
              .buttonStyle(PlainButtonStyle())

              Button(intent: ResumeIntent()) {
                ZStack {
                  Circle()
                    .fill(Color(hex: "#007bff"))
                    .frame(width: 44, height: 44)
                  Image(systemName: "play.fill")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
                }
              }
              .buttonStyle(PlainButtonStyle())
            }
          }

          Spacer()
        }
      }
      .padding(16)
    }
  }
}

// MARK: - Expanded View
struct ExpandedLiveActivityView: View {
  let context: ActivityViewContext<LiveActivityAttributes>

  var body: some View {
    ZStack {
      Color.black.opacity(0.8)
        .clipShape(RoundedRectangle(cornerRadius: 24))

      VStack(spacing: 16) {
        HStack(spacing: 8) {
          ActivityIcon(activityIcon: mapJSIconToSFSymbol(context.attributes.activityIcon),
                      themeColor: .white,
                      size: 20)

          Text(context.attributes.activityName)
            .foregroundColor(.white)
            .font(.system(size: 18, weight: .semibold))
        }

        if !context.state.isRunning() {
          Text(context.state.getFormattedElapsedTime())
            .font(.system(size: 38, weight: .bold, design: .rounded))
            .foregroundColor(.white)
            .fontWeight(.medium)
            .monospacedDigit()
        } else {
          Text(timerInterval: context.state.startedAt...context.state.getFutureDate(),
               pauseTime: nil,
               countsDown: false,
               showsHours: false)
            .font(.system(size: 38, weight: .bold, design: .rounded))
            .foregroundColor(.white)
            .fontWeight(.medium)
            .monospacedDigit()
        }

        if context.state.isRunning() {
          Button(intent: PauseIntent()) {
            ZStack {
              Circle()
                .fill(Color(hex: "#007bff"))
                .frame(width: 56, height: 56)
              Image(systemName: "pause.fill")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.white)
            }
          }
          .buttonStyle(PlainButtonStyle())
        } else {
          HStack(spacing: 16) {
            Button(intent: CompleteIntent()) {
              ZStack {
                Circle()
                  .fill(Color(hex: "#28a745"))
                  .frame(width: 46, height: 46)
                Image(systemName: "checkmark")
                  .font(.system(size: 20, weight: .bold))
                  .foregroundColor(.white)
              }
            }
            .buttonStyle(PlainButtonStyle())

            Button(intent: ResumeIntent()) {
              ZStack {
                Circle()
                  .fill(Color(hex: "#007bff"))
                  .frame(width: 56, height: 56)
                Image(systemName: "play.fill")
                  .font(.system(size: 24, weight: .bold))
                  .foregroundColor(.white)
              }
            }
            .buttonStyle(PlainButtonStyle())
          }
        }
      }
      .padding(16)
    }
  }
}

// MARK: - Activity Icon
struct ActivityIcon: View {
  let activityIcon: String
  let themeColor: Color
  let size: CGFloat

  var body: some View {
    Image(systemName: activityIcon)
      .font(.system(size: size))
      .foregroundColor(themeColor)
  }
}

extension LiveActivityAttributes {
  fileprivate static var preview: LiveActivityAttributes {
    LiveActivityAttributes(
      activityName: "Running",
      activityIcon: "RUNNING"
    )
  }

  fileprivate static var workoutPreview: LiveActivityAttributes {
    LiveActivityAttributes(
      activityName: "Workout",
      activityIcon: "WORKOUT"
    )
  }

  fileprivate static var meditationPreview: LiveActivityAttributes {
    LiveActivityAttributes(
      activityName: "Meditation",
      activityIcon: "BIKING"
    )
  }
}

extension LiveActivityAttributes.ContentState {
  fileprivate static var runningState: LiveActivityAttributes.ContentState {
    LiveActivityAttributes.ContentState(
      startedAt: Date().addingTimeInterval(-300), // 5 minutes ago
      pausedAt: nil
    )
  }

  fileprivate static var pausedState: LiveActivityAttributes.ContentState {
    LiveActivityAttributes.ContentState(
      startedAt: Date().addingTimeInterval(-600), // 10 minutes ago
      pausedAt: Date().addingTimeInterval(-120)  // Paused 2 minutes ago
    )
  }

  fileprivate static var longRunningState: LiveActivityAttributes.ContentState {
    LiveActivityAttributes.ContentState(
      startedAt: Date().addingTimeInterval(-3600), // 1 hour ago
      pausedAt: nil
    )
  }
}

// MARK: - Previews
#Preview("Running - Notification", as: .content, using: LiveActivityAttributes.preview) {
  LiveActivityWidget()
} contentStates: {
  LiveActivityAttributes.ContentState.runningState
}

#Preview("Paused - Notification", as: .content, using: LiveActivityAttributes.preview) {
  LiveActivityWidget()
} contentStates: {
  LiveActivityAttributes.ContentState.pausedState
}

#Preview("Running - Compact", as: .dynamicIsland(.compact), using: LiveActivityAttributes.preview) {
  LiveActivityWidget()
} contentStates: {
  LiveActivityAttributes.ContentState.runningState
}

#Preview("Paused - Compact", as: .dynamicIsland(.compact), using: LiveActivityAttributes.preview) {
  LiveActivityWidget()
} contentStates: {
  LiveActivityAttributes.ContentState.pausedState
}

#Preview("Running - Expanded", as: .dynamicIsland(.expanded), using: LiveActivityAttributes.preview) {
  LiveActivityWidget()
} contentStates: {
  LiveActivityAttributes.ContentState.runningState
}

#Preview("Paused - Expanded", as: .dynamicIsland(.expanded), using: LiveActivityAttributes.preview) {
  LiveActivityWidget()
} contentStates: {
  LiveActivityAttributes.ContentState.pausedState
}

#Preview("Workout - Expanded", as: .dynamicIsland(.expanded), using: LiveActivityAttributes.workoutPreview) {
  LiveActivityWidget()
} contentStates: {
  LiveActivityAttributes.ContentState.longRunningState
}

#Preview("Minimal View", as: .dynamicIsland(.minimal), using: LiveActivityAttributes.meditationPreview) {
  LiveActivityWidget()
} contentStates: {
  LiveActivityAttributes.ContentState.runningState
}

extension Notification.Name {
  static let pauseFromWidget = Notification.Name("pauseFromWidget")
  static let resumeFromWidget = Notification.Name("resumeFromWidget")
  static let completeFromWidget = Notification.Name("completeFromWidget")
}

