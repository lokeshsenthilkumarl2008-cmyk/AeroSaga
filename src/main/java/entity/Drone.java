package entity;

import enums.DroneStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "drones")
public class Drone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // MySQL auto-increment
    private Long id;

    @Column(nullable = false)
    private String name;

    private String location;

    public void setName(String name) {
		this.name = name;
	}

	public void setLatitude(double latitude) {
		this.latitude = latitude;
	}

	public void setLongitude(double longitude) {
		this.longitude = longitude;
	}

	public void setHomeLatitude(double homeLatitude) {
		this.homeLatitude = homeLatitude;
	}

	public void setHomeLongitude(double homeLongitude) {
		this.homeLongitude = homeLongitude;
	}

	@Column(nullable = false)
    private double batteryLevel;

    private double latitude;
    private double longitude;

    private double homeLatitude;
    private double homeLongitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DroneStatus status = DroneStatus.AVAILABLE;

    protected Drone() {
    }

    public Drone(
            String name,
            double batteryLevel,
            double latitude,
            double longitude) {

        this.name = name;
        this.batteryLevel = batteryLevel;
        this.latitude = latitude;
        this.longitude = longitude;
        this.homeLatitude = latitude;
        this.homeLongitude = longitude;
        this.status = DroneStatus.AVAILABLE;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public double getBatteryLevel() {
        return batteryLevel;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public double getHomeLatitude() {
        return homeLatitude;
    }

    public double getHomeLongitude() {
        return homeLongitude;
    }

    public DroneStatus getStatus() {
        return status;
    }

    // Setters
    public void setBatteryLevel(double batteryLevel) {
        if (!Double.isFinite(batteryLevel)
                || batteryLevel < 0 || batteryLevel > 100) {
            throw new IllegalArgumentException(
                    "Battery must be between 0 and 100");
        }
        this.batteryLevel = batteryLevel;
    }

    public void setId(Long id) {
		this.id = id;
	}

	public void setPosition(double latitude, double longitude) {
        if (!Double.isFinite(latitude)
                || latitude < -90 || latitude > 90
                || !Double.isFinite(longitude)
                || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException(
                    "Invalid coordinates");
        }
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public void setStatus(DroneStatus status) {
        this.status = status;
    }

	public String getSerialNumber() {
		// TODO Auto-generated method stub
		return null;
	}
}
