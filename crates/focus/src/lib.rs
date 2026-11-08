use std::collections::HashSet;
use std::fmt;

use serde::{Deserialize, Deserializer, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

pub fn parse_uuid<E: serde::de::Error>(value: &str) -> Result<Uuid, E> {
    let bytes = value.as_bytes();
    let canonical = bytes.len() == 36
        && [8, 13, 18, 23].iter().all(|&index| bytes[index] == b'-')
        && bytes
            .iter()
            .enumerate()
            .all(|(index, byte)| [8, 13, 18, 23].contains(&index) || byte.is_ascii_hexdigit());
    let parsed = Uuid::parse_str(value).map_err(E::custom)?;
    let valid_bits = matches!(bytes.get(14), Some(b'1'..=b'8'))
        && matches!(bytes.get(19), Some(b'8' | b'9' | b'a' | b'A' | b'b' | b'B'));
    if !canonical
        || !(valid_bits || parsed.is_nil() || value == "ffffffff-ffff-ffff-ffff-ffffffffffff")
    {
        return Err(E::custom("invalid UUID"));
    }
    Ok(parsed)
}

fn deserialize_workspace_uuid<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<String, D::Error> {
    let value = String::deserialize(deserializer)?;
    parse_uuid::<D::Error>(&value)?;
    Ok(value)
}

fn deserialize_optional_workspace_uuid<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<Option<String>, D::Error> {
    let value = Option::<String>::deserialize(deserializer)?;
    if let Some(id) = &value {
        parse_uuid::<D::Error>(id)?;
    }
    Ok(value)
}

fn integer<E: serde::de::Error>(value: f64, min: f64, max: f64) -> Result<f64, E> {
    if !value.is_finite() || value.fract() != 0.0 || !(min..=max).contains(&value) {
        return Err(E::custom("invalid integer"));
    }
    Ok(value)
}

fn deserialize_count<'de, D: Deserializer<'de>>(deserializer: D) -> Result<u32, D::Error> {
    let value = f64::deserialize(deserializer)?;
    Ok(integer::<D::Error>(value, 0.0, f64::from(u32::MAX))? as u32)
}

fn deserialize_timestamp<'de, D: Deserializer<'de>>(deserializer: D) -> Result<i64, D::Error> {
    let value = f64::deserialize(deserializer)?;
    Ok(integer::<D::Error>(value, -8_640_000_000_000_000.0, 8_640_000_000_000_000.0)? as i64)
}

fn deserialize_optional_timestamp<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<Option<i64>, D::Error> {
    let value = Option::<f64>::deserialize(deserializer)?;
    value
        .map(|value| {
            integer::<D::Error>(value, -8_640_000_000_000_000.0, 8_640_000_000_000_000.0)
                .map(|value| value as i64)
        })
        .transpose()
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
pub enum ProjectColor {
    #[serde(rename = "red")]
    Red,
    #[serde(rename = "orange")]
    Orange,
    #[serde(rename = "yellow")]
    Yellow,
    #[serde(rename = "green")]
    Green,
    #[serde(rename = "blue")]
    Blue,
    #[serde(rename = "purple")]
    Purple,
    #[serde(rename = "gray")]
    Gray,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
pub enum Alarm {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "bell")]
    Bell,
    #[serde(rename = "chime")]
    Chime,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
pub enum FocusSound {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "rain")]
    Rain,
    #[serde(rename = "white_noise")]
    WhiteNoise,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
pub enum WeekStart {
    #[serde(rename = "sunday")]
    Sunday,
    #[serde(rename = "monday")]
    Monday,
    #[serde(rename = "saturday")]
    Saturday,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
pub enum HourFormat {
    #[serde(rename = "12h")]
    Twelve,
    #[serde(rename = "24h")]
    TwentyFour,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
pub enum Theme {
    #[serde(rename = "system")]
    System,
    #[serde(rename = "light")]
    Light,
    #[serde(rename = "dark")]
    Dark,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
pub enum TimerPhase {
    #[serde(rename = "focus")]
    Focus,
    #[serde(rename = "short_break")]
    ShortBreak,
    #[serde(rename = "long_break")]
    LongBreak,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct Task {
    #[serde(deserialize_with = "deserialize_workspace_uuid")]
    #[schema(value_type = Uuid)]
    pub id: String,
    pub title: String,
    pub note: String,
    #[schema(minimum = 1, maximum = 10000, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub estimate: u32,
    #[schema(minimum = 0, maximum = 4294967295_u64, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub actual: u32,
    pub completed: bool,
    #[serde(deserialize_with = "deserialize_optional_workspace_uuid")]
    #[schema(value_type = Option<Uuid>, required)]
    pub project_id: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct Project {
    #[serde(deserialize_with = "deserialize_workspace_uuid")]
    #[schema(value_type = Uuid)]
    pub id: String,
    pub name: String,
    pub color: ProjectColor,
    pub archived: bool,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct TemplateTask {
    pub title: String,
    pub note: String,
    #[schema(minimum = 1, maximum = 10000, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub estimate: u32,
    #[serde(deserialize_with = "deserialize_optional_workspace_uuid")]
    #[schema(value_type = Option<Uuid>, required)]
    pub project_id: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct Template {
    #[serde(deserialize_with = "deserialize_workspace_uuid")]
    #[schema(value_type = Uuid)]
    pub id: String,
    pub name: String,
    pub tasks: Vec<TemplateTask>,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct Session {
    #[serde(deserialize_with = "deserialize_workspace_uuid")]
    #[schema(value_type = Uuid)]
    pub id: String,
    #[serde(deserialize_with = "deserialize_optional_workspace_uuid")]
    #[schema(value_type = Option<Uuid>, required)]
    pub task_id: Option<String>,
    pub task_title: String,
    #[serde(deserialize_with = "deserialize_optional_workspace_uuid")]
    #[schema(value_type = Option<Uuid>, required)]
    pub project_id: Option<String>,
    pub project_name: String,
    #[schema(minimum = -8640000000000000_i64, maximum = 8640000000000000_i64)]
    #[serde(deserialize_with = "deserialize_timestamp")]
    pub started_at_ms: i64,
    #[schema(minimum = 1, maximum = 4294967295_u64, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub duration_seconds: u32,
    pub completed: bool,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct Settings {
    #[schema(minimum = 1, maximum = 180, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub focus_minutes: u32,
    #[schema(minimum = 1, maximum = 180, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub short_minutes: u32,
    #[schema(minimum = 1, maximum = 180, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub long_minutes: u32,
    #[schema(minimum = 1, maximum = 10000, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub long_break_interval: u32,
    pub auto_start_breaks: bool,
    pub auto_start_focus: bool,
    pub auto_check_tasks: bool,
    pub check_to_bottom: bool,
    pub alarm: Alarm,
    #[schema(minimum = 0, maximum = 100, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub alarm_volume: u32,
    #[schema(minimum = 1, maximum = 10, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub alarm_repeat: u32,
    pub focus_sound: FocusSound,
    #[schema(minimum = 0, maximum = 100, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub focus_sound_volume: u32,
    pub week_start: WeekStart,
    pub hour_format: HourFormat,
    pub dark_while_running: bool,
    pub theme: Theme,
    #[schema(minimum = 0, maximum = 180, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub reminder_minutes: u32,
    pub notifications: bool,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct Timer {
    pub phase: TimerPhase,
    #[schema(minimum = 0, maximum = 10800)]
    pub remaining_seconds: f64,
    #[serde(deserialize_with = "deserialize_optional_timestamp")]
    #[schema(required)]
    pub deadline_ms: Option<i64>,
    #[serde(deserialize_with = "deserialize_optional_workspace_uuid")]
    #[schema(value_type = Option<Uuid>, required)]
    pub run_id: Option<String>,
    #[serde(deserialize_with = "deserialize_optional_timestamp")]
    #[schema(required)]
    pub started_at_ms: Option<i64>,
    #[schema(minimum = 0, maximum = 4294967295_u64, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub completed_focus_count: u32,
    #[serde(deserialize_with = "deserialize_optional_workspace_uuid")]
    #[schema(value_type = Option<Uuid>, required)]
    pub selected_task_id: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct Workspace {
    #[schema(minimum = 1, maximum = 1, value_type = u64)]
    #[serde(deserialize_with = "deserialize_count")]
    pub schema_version: u32,
    pub tasks: Vec<Task>,
    pub projects: Vec<Project>,
    pub templates: Vec<Template>,
    pub sessions: Vec<Session>,
    pub settings: Settings,
    pub timer: Timer,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(transparent)]
pub struct ValidatedWorkspace(Workspace);

impl ValidatedWorkspace {
    pub fn as_workspace(&self) -> &Workspace {
        &self.0
    }

    pub fn into_workspace(self) -> Workspace {
        self.0
    }
}

impl TryFrom<Workspace> for ValidatedWorkspace {
    type Error = ValidationError;

    fn try_from(mut workspace: Workspace) -> Result<Self, Self::Error> {
        workspace.validate()?;
        Ok(Self(workspace))
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ValidationError {
    InvalidField(&'static str),
    DuplicateId(&'static str),
    UnknownProject,
    UnknownSelectedTask,
    InvalidTimerRun,
}

impl fmt::Display for ValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidField(field) => write!(f, "invalid {field}"),
            Self::DuplicateId(field) => write!(f, "duplicate {field} ID"),
            Self::UnknownProject => write!(f, "unknown project"),
            Self::UnknownSelectedTask => write!(f, "unknown selected task"),
            Self::InvalidTimerRun => write!(f, "invalid timer run"),
        }
    }
}

impl std::error::Error for ValidationError {}

fn js_whitespace(c: char) -> bool {
    matches!(c, '\u{0009}'..='\u{000d}' | '\u{0020}' | '\u{00a0}' | '\u{1680}' | '\u{2000}'..='\u{200a}' | '\u{2028}' | '\u{2029}' | '\u{202f}' | '\u{205f}' | '\u{3000}' | '\u{feff}')
}

fn title(value: &mut String, field: &'static str) -> Result<(), ValidationError> {
    *value = value.trim_matches(js_whitespace).to_owned();
    if value.is_empty() {
        return Err(ValidationError::InvalidField(field));
    }
    text(value, 500, field)
}

fn text(value: &str, max: usize, field: &'static str) -> Result<(), ValidationError> {
    if value.contains('\0') || value.encode_utf16().count() > max {
        return Err(ValidationError::InvalidField(field));
    }
    Ok(())
}

fn range(value: u32, min: u32, max: u32, field: &'static str) -> Result<(), ValidationError> {
    if !(min..=max).contains(&value) {
        return Err(ValidationError::InvalidField(field));
    }
    Ok(())
}

fn timestamp(value: i64, field: &'static str) -> Result<(), ValidationError> {
    if !(-8_640_000_000_000_000..=8_640_000_000_000_000).contains(&value) {
        return Err(ValidationError::InvalidField(field));
    }
    Ok(())
}

fn unique<'a>(
    ids: impl Iterator<Item = &'a str>,
    field: &'static str,
) -> Result<(), ValidationError> {
    let mut seen = HashSet::new();
    for id in ids {
        if !seen.insert(id) {
            return Err(ValidationError::DuplicateId(field));
        }
    }
    Ok(())
}

impl Workspace {
    pub fn validate(&mut self) -> Result<(), ValidationError> {
        let ids = self
            .tasks
            .iter()
            .flat_map(|task| [Some(task.id.as_str()), task.project_id.as_deref()])
            .chain(
                self.projects
                    .iter()
                    .map(|project| Some(project.id.as_str())),
            )
            .chain(self.templates.iter().flat_map(|template| {
                std::iter::once(Some(template.id.as_str()))
                    .chain(template.tasks.iter().map(|task| task.project_id.as_deref()))
            }))
            .chain(self.sessions.iter().flat_map(|session| {
                [
                    Some(session.id.as_str()),
                    session.task_id.as_deref(),
                    session.project_id.as_deref(),
                ]
            }))
            .chain([
                self.timer.run_id.as_deref(),
                self.timer.selected_task_id.as_deref(),
            ]);
        for id in ids.flatten() {
            parse_uuid::<serde::de::value::Error>(id)
                .map_err(|_| ValidationError::InvalidField("id"))?;
        }
        if self.schema_version != 1 {
            return Err(ValidationError::InvalidField("schema_version"));
        }
        for (len, max, field) in [
            (self.tasks.len(), 10_000, "tasks"),
            (self.projects.len(), 10_000, "projects"),
            (self.templates.len(), 10_000, "templates"),
            (self.sessions.len(), 100_000, "sessions"),
        ] {
            if len > max {
                return Err(ValidationError::InvalidField(field));
            }
        }
        unique(self.tasks.iter().map(|item| item.id.as_str()), "tasks")?;
        unique(
            self.projects.iter().map(|item| item.id.as_str()),
            "projects",
        )?;
        unique(
            self.templates.iter().map(|item| item.id.as_str()),
            "templates",
        )?;
        unique(
            self.sessions.iter().map(|item| item.id.as_str()),
            "sessions",
        )?;
        for project in &mut self.projects {
            title(&mut project.name, "project.name")?;
        }
        let projects: HashSet<_> = self
            .projects
            .iter()
            .map(|project| project.id.as_str())
            .collect();
        for task in &mut self.tasks {
            title(&mut task.title, "task.title")?;
            text(&task.note, 10_000, "task.note")?;
            range(task.estimate, 1, 10_000, "task.estimate")?;
            if task
                .project_id
                .as_deref()
                .is_some_and(|id| !projects.contains(id))
            {
                return Err(ValidationError::UnknownProject);
            }
        }
        for template in &mut self.templates {
            title(&mut template.name, "template.name")?;
            if template.tasks.len() > 10_000 {
                return Err(ValidationError::InvalidField("template.tasks"));
            }
            for task in &mut template.tasks {
                title(&mut task.title, "template_task.title")?;
                text(&task.note, 10_000, "template_task.note")?;
                range(task.estimate, 1, 10_000, "template_task.estimate")?;
                if task
                    .project_id
                    .as_deref()
                    .is_some_and(|id| !projects.contains(id))
                {
                    return Err(ValidationError::UnknownProject);
                }
            }
        }
        for session in &mut self.sessions {
            title(&mut session.task_title, "session.task_title")?;
            text(&session.project_name, 500, "session.project_name")?;
            timestamp(session.started_at_ms, "session.started_at_ms")?;
            range(
                session.duration_seconds,
                1,
                u32::MAX,
                "session.duration_seconds",
            )?;
        }
        let settings = &self.settings;
        for (value, min, max, field) in [
            (settings.focus_minutes, 1, 180, "focus_minutes"),
            (settings.short_minutes, 1, 180, "short_minutes"),
            (settings.long_minutes, 1, 180, "long_minutes"),
            (
                settings.long_break_interval,
                1,
                10_000,
                "long_break_interval",
            ),
            (settings.alarm_volume, 0, 100, "alarm_volume"),
            (settings.alarm_repeat, 1, 10, "alarm_repeat"),
            (settings.focus_sound_volume, 0, 100, "focus_sound_volume"),
            (settings.reminder_minutes, 0, 180, "reminder_minutes"),
        ] {
            range(value, min, max, field)?;
        }
        let timer = &self.timer;
        let phase_minutes = match timer.phase {
            TimerPhase::Focus => settings.focus_minutes,
            TimerPhase::ShortBreak => settings.short_minutes,
            TimerPhase::LongBreak => settings.long_minutes,
        };
        if !timer.remaining_seconds.is_finite()
            || !(0.0..=f64::from(phase_minutes) * 60.0).contains(&timer.remaining_seconds)
        {
            return Err(ValidationError::InvalidField("timer.remaining_seconds"));
        }
        if let Some(value) = timer.deadline_ms {
            timestamp(value, "timer.deadline_ms")?;
        }
        if let Some(value) = timer.started_at_ms {
            timestamp(value, "timer.started_at_ms")?;
        }
        if (timer.deadline_ms.is_some() && timer.run_id.is_none())
            || timer.run_id.is_some() != timer.started_at_ms.is_some()
        {
            return Err(ValidationError::InvalidTimerRun);
        }
        if timer
            .run_id
            .as_deref()
            .is_some_and(|id| self.sessions.iter().any(|session| session.id == id))
        {
            return Err(ValidationError::InvalidTimerRun);
        }
        if timer
            .selected_task_id
            .as_deref()
            .is_some_and(|id| !self.tasks.iter().any(|task| task.id == id))
        {
            return Err(ValidationError::UnknownSelectedTask);
        }
        Ok(())
    }
}

impl Default for Workspace {
    fn default() -> Self {
        Self {
            schema_version: 1,
            tasks: Vec::new(),
            projects: Vec::new(),
            templates: Vec::new(),
            sessions: Vec::new(),
            settings: Settings::default(),
            timer: Timer::default(),
        }
    }
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            focus_minutes: 25,
            short_minutes: 5,
            long_minutes: 15,
            long_break_interval: 4,
            auto_start_breaks: false,
            auto_start_focus: false,
            auto_check_tasks: false,
            check_to_bottom: false,
            alarm: Alarm::Bell,
            alarm_volume: 50,
            alarm_repeat: 1,
            focus_sound: FocusSound::None,
            focus_sound_volume: 50,
            week_start: WeekStart::Monday,
            hour_format: HourFormat::TwentyFour,
            dark_while_running: false,
            theme: Theme::System,
            reminder_minutes: 0,
            notifications: false,
        }
    }
}

impl Default for Timer {
    fn default() -> Self {
        Self {
            phase: TimerPhase::Focus,
            remaining_seconds: 1500.0,
            deadline_ms: None,
            run_id: None,
            started_at_ms: None,
            completed_focus_count: 0,
            selected_task_id: None,
        }
    }
}
