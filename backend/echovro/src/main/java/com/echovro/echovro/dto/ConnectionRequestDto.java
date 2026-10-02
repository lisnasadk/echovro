package com.echovro.echovro.dto;

public class ConnectionRequestDto {
    private String to;
    private SongInfo song;

    public static class SongInfo {
        private String t;     // song title
        private String svc;   // service (spotify, ytm, gaana)
        private String link;  // song link

        public SongInfo() {}

        public String getT() {
            return t;
        }

        public void setT(String t) {
            this.t = t;
        }

        public String getSvc() {
            return svc;
        }

        public void setSvc(String svc) {
            this.svc = svc;
        }

        public String getLink() {
            return link;
        }

        public void setLink(String link) {
            this.link = link;
        }
    }

    public ConnectionRequestDto() {}

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public SongInfo getSong() {
        return song;
    }

    public void setSong(SongInfo song) {
        this.song = song;
    }
}
