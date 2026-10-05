package com.echovro.echovro.dto;

public class SongSnapDto {
    private Long id;
    private String t;
    private String svc;
    private String link;
    private String col;
    private String from;
    private boolean me;
    private String createdAt;

    public SongSnapDto() {}

    public SongSnapDto(Long id, String t, String svc, String link, String col, String from, boolean me, String createdAt) {
        this.id = id;
        this.t = t;
        this.svc = svc;
        this.link = link;
        this.col = col;
        this.from = from;
        this.me = me;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getCol() {
        return col;
    }

    public void setCol(String col) {
        this.col = col;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public boolean isMe() {
        return me;
    }

    public void setMe(boolean me) {
        this.me = me;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
