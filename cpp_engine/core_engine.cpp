#include <iostream>
#include <cstring>

struct Patient {
    int id;
    char name[100];
    int age;
    int risk_score;
    Patient* next;
    Patient* left;
    Patient* right;
};

struct Task {
    int id;
    char patient_name[100];
    char description[200];
    char time_str[50];
    Task* next;
};

const int TABLE_SIZE = 100;
class PatientHashMap {
private:
    Patient* table[TABLE_SIZE];
    int hashFunction(int id) { return id % TABLE_SIZE; }
public:
    PatientHashMap() { for (int i = 0; i < TABLE_SIZE; i++) table[i] = nullptr; }
    void insert(Patient* p) {
        int index = hashFunction(p->id);
        if (table[index] == nullptr) table[index] = p;
        else {
            Patient* temp = table[index];
            while (temp->next != nullptr) temp = temp->next;
            temp->next = p;
        }
    }
    Patient* search(int id) {
        int index = hashFunction(id);
        Patient* temp = table[index];
        while (temp != nullptr) {
            if (temp->id == id) return temp;
            temp = temp->next;
        }
        return nullptr;
    }
};

class RiskBST {
private:
    Patient* root;
    void insertHelper(Patient*& node, Patient* new_patient) {
        if (node == nullptr) { node = new_patient; return; }
        if (new_patient->risk_score >= node->risk_score) insertHelper(node->right, new_patient);
        else insertHelper(node->left, new_patient);
    }
    void getTopRisksHelper(Patient* node, int* out_ids, int& count, int max_size) {
        if (node == nullptr || count >= max_size) return;
        getTopRisksHelper(node->right, out_ids, count, max_size);
        if (count < max_size) out_ids[count++] = node->id;
        getTopRisksHelper(node->left, out_ids, count, max_size);
    }
public:
    RiskBST() : root(nullptr) {}
    void insert(Patient* p) { insertHelper(root, p); }
    int getTopRisks(int* out_ids, int max_size) {
        int count = 0;
        getTopRisksHelper(root, out_ids, count, max_size);
        return count;
    }
};

class TaskQueue {
private:
    Task* front;
    Task* rear;
    int count;

public:
    TaskQueue() : front(nullptr), rear(nullptr), count(0) {}

    void enqueue(int id, const char* name, const char* desc, const char* time) {
        Task* new_task = new Task();
        new_task->id = id;
        strncpy(new_task->patient_name, name, 99);
        strncpy(new_task->description, desc, 199);
        strncpy(new_task->time_str, time, 49);
        new_task->next = nullptr;

        if (rear == nullptr) {
            front = rear = new_task;
        } else {
            rear->next = new_task;
            rear = new_task;
        }
        count++;
    }

    void dequeue() {
        if (front == nullptr) return;
        Task* temp = front;
        front = front->next;
        if (front == nullptr) rear = nullptr;
        delete temp;
        count--;
    }

    int get_size() { return count; }

    Task* get_task_at(int index) {
        if (index >= count || index < 0) return nullptr;
        Task* temp = front;
        for (int i = 0; i < index; i++) temp = temp->next;
        return temp;
    }
};

PatientHashMap global_patient_map;
RiskBST global_risk_bst;
TaskQueue global_task_queue;

extern "C" {
    void create_patient(int id, const char* name, int age, int risk_score) {
        Patient* p = new Patient();
        p->id = id; strncpy(p->name, name, 99); p->age = age; p->risk_score = risk_score;
        p->next = nullptr; p->left = nullptr; p->right = nullptr;
        global_patient_map.insert(p);
        global_risk_bst.insert(p);
    }
    const char* get_patient_name(int id) {
        Patient* p = global_patient_map.search(id);
        return p ? p->name : "Not Found";
    }
    int get_patient_age(int id) {
        Patient* p = global_patient_map.search(id);
        return p ? p->age : -1;
    }
    int get_patient_risk(int id) {
        Patient* p = global_patient_map.search(id);
        return p ? p->risk_score : -1;
    }
    int get_high_risk_patients(int* out_ids, int max_size) {
        return global_risk_bst.getTopRisks(out_ids, max_size);
    }

    void add_task(int id, const char* name, const char* desc, const char* time) {
        global_task_queue.enqueue(id, name, desc, time);
    }
    void complete_task() {
        global_task_queue.dequeue();
    }
    int get_task_count() {
        return global_task_queue.get_size();
    }
    int get_task_id(int index) {
        Task* t = global_task_queue.get_task_at(index);
        return t ? t->id : -1;
    }
    const char* get_task_name(int index) {
        Task* t = global_task_queue.get_task_at(index);
        return t ? t->patient_name : "";
    }
    const char* get_task_desc(int index) {
        Task* t = global_task_queue.get_task_at(index);
        return t ? t->description : "";
    }
    const char* get_task_time(int index) {
        Task* t = global_task_queue.get_task_at(index);
        return t ? t->time_str : "";
    }
}
