
package excecption;

public class MissionNotFoundException extends RuntimeException {

    public MissionNotFoundException(String missionId) {
        super("Mission not found: " + missionId);
    }
}
