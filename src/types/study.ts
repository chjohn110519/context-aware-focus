export interface StudySection {
  heading: string;
  content: string;
}

export interface StudySet {
  title: string;
  subtitle: string;
  sections: StudySection[];
}
