# Missing distribution license

`client-only@0.0.1`, the React server/client module marker used by React Aria,
declares MIT in its package metadata but does not ship the license text.
`client-only.LICENSE` retains the upstream React license from
[facebook/react revision 278794d7dee9cd2a3a2aaf9f0b2a4b8b747d74ee](https://github.com/facebook/react/blob/278794d7dee9cd2a3a2aaf9f0b2a4b8b747d74ee/LICENSE).
The notice generator uses this fallback for that exact package version only;
other missing distribution notices still fail the build.
