package com.echovro.echovro.service;

import com.echovro.echovro.dto.SyncEventDto;
import com.echovro.echovro.model.SyncEvent;
import com.echovro.echovro.repository.SyncEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
public class SyncService {

    private final SyncEventRepository syncEventRepository;

    public SyncService(SyncEventRepository syncEventRepository) {
        this.syncEventRepository = syncEventRepository;
    }

    public void emit(String fromUser, String toUser, String eventType, String payload) {
        if (toUser == null || toUser.isBlank()) return;
        SyncEvent event = new SyncEvent(fromUser, toUser, eventType, payload);
        syncEventRepository.save(event);
    }

    @Transactional
    public List<SyncEventDto> pollUndeliveredEvents(String username) {
        List<SyncEvent> events = syncEventRepository.findUndeliveredForUser(username);
        List<SyncEventDto> dtos = new ArrayList<>();
        for (SyncEvent e : events) {
            e.setDelivered(true);
            syncEventRepository.save(e);
            dtos.add(new SyncEventDto(
                    e.getId(),
                    e.getFromUser(),
                    e.getToUser(),
                    e.getEventType(),
                    e.getPayload(),
                    e.getCreatedAt().toEpochSecond(ZoneOffset.UTC)
            ));
        }
        return dtos;
    }
}
